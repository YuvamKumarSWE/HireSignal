import { getRandomVoice } from './elevenlabs.service.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFirestore } from '../config/firebase.js';

// In-memory store keeps sessions alive during the interview
const interviewSessions = new Map();

// Mock questions fallback when Gemini API is unavailable
const MOCK_QUESTIONS = [
  {
    id: "q1",
    question: "Tell me about yourself and your background.",
    category: "introduction",
    expectedDuration: 120
  },
  {
    id: "q2",
    question: "Why are you interested in this position?",
    category: "motivation",
    expectedDuration: 90
  },
  {
    id: "q3",
    question: "What are your greatest strengths as a developer?",
    category: "skills",
    expectedDuration: 90
  },
  {
    id: "q4",
    question: "Describe a challenging project you worked on and how you overcame obstacles.",
    category: "problem-solving",
    expectedDuration: 120
  },
  {
    id: "q5",
    question: "Where do you see yourself in 5 years?",
    category: "career-goals",
    expectedDuration: 90
  }
];

/**
 * Generate interview questions based on job specification
 * @param {Object} jobSpec - Job specification details
 * @returns {Array} Array of interview questions
 */
export async function generateInterviewQuestions(jobSpec) {
  const API_KEY = process.env.GEMINI_API_KEY;
  const { role, level, jobDescription, company } = jobSpec;

  if (!API_KEY) {
    console.warn("GEMINI_API_KEY is not set, using mock questions");
    return MOCK_QUESTIONS;
  }

  const prompt = `
You are an expert interviewer. Generate 5 basic interview questions for a ${level || 'Mid-level'} ${role || 'Software Engineer'} position${company ? ` at ${company}` : ''}.

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}

Generate questions that assess:
1. Communication skills
2. Problem-solving ability
3. Technical knowledge (basic)
4. Cultural fit
5. Career motivation

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Tell me about yourself and your background.",
      "category": "introduction",
      "expectedDuration": 120
    },
    {
      "id": "q2",
      "question": "Why are you interested in this position?",
      "category": "motivation",
      "expectedDuration": 90
    }
  ]
}

Make questions natural and conversational. Include the question text only, no additional instructions.
`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parsed.questions || [];
  } catch (e) {
    console.error("Gemini API error:", e);
    console.log("⚠️  Using mock questions as fallback");
    return MOCK_QUESTIONS;
  }
}

/**
 * Create a new interview session
 * @param {Object} jobSpec - Job specification
 * @param {string} userId - User ID
 * @returns {Object} Session details
 */
export async function createInterviewSession(jobSpec, userId) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const questions = await generateInterviewQuestions(jobSpec);
  
  // Randomly select a voice for this interview
  const selectedVoice = getRandomVoice();
  console.log(`🎙️  Selected voice for interview: ${selectedVoice.name} (${selectedVoice.description})`);
  
  const session = {
    sessionId,
    userId,
    jobSpec,
    questions,
    currentQuestionIndex: 0,
    answers: [],
    startedAt: new Date(),
    status: 'active',
    voice: selectedVoice  // Store the selected voice in the session
  };
  
  interviewSessions.set(sessionId, session);

  // Persist to Firestore
  const db = getFirestore();
  if (db) {
    await db.collection('interviews').doc(sessionId).set({
      userId,
      jobSpec,
      questions,
      answers: [],
      evaluation: null,
      voice: selectedVoice,
      startedAt: new Date(),
      completedAt: null,
      status: 'active'
    });
  }

  return {
    sessionId,
    totalQuestions: questions.length,
    currentQuestion: 0,
    voice: {
      name: selectedVoice.name,
      description: selectedVoice.description,
      gender: selectedVoice.gender
    }
  };
}

/**
 * Get the next question in the interview
 * @param {string} sessionId - Session ID
 * @returns {Object} Question details
 */
export function getNextQuestion(sessionId) {
  const session = interviewSessions.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status !== 'active') {
    throw new Error('Session is not active');
  }
  
  const currentIndex = session.currentQuestionIndex;
  
  if (currentIndex >= session.questions.length) {
    session.status = 'completed';
    return {
      completed: true,
      message: 'Interview completed',
      totalQuestions: session.questions.length
    };
  }
  
  const question = session.questions[currentIndex];
  
  return {
    questionNumber: currentIndex + 1,
    totalQuestions: session.questions.length,
    question: question.question,
    questionId: question.id,
    category: question.category,
    expectedDuration: question.expectedDuration
  };
}

/**
 * Submit an answer to a question
 * @param {string} sessionId - Session ID
 * @param {string} questionId - Question ID
 * @param {string} answer - User's answer (text)
 * @param {string} answerType - 'text' or 'audio'
 * @returns {Object} Submission result
 */
export function submitAnswer(sessionId, questionId, answer, answerType = 'text') {
  const session = interviewSessions.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status !== 'active') {
    throw new Error('Session is not active');
  }
  
  const currentIndex = session.currentQuestionIndex;
  const currentQuestion = session.questions[currentIndex];
  
  if (!currentQuestion) {
    throw new Error('No more questions available');
  }
  
  // Verify questionId matches the current question
  if (currentQuestion.id !== questionId) {
    throw new Error('Question ID mismatch - answering wrong question');
  }
  
  // Store the answer
  session.answers.push({
    questionId,
    question: currentQuestion.question,
    answer,
    answerType,
    category: currentQuestion.category,
    answeredAt: new Date()
  });
  
  // Move to next question
  session.currentQuestionIndex++;
  
  const hasMoreQuestions = session.currentQuestionIndex < session.questions.length;
  
  // Mark session as completed if this was the last question
  if (!hasMoreQuestions) {
    session.status = 'completed';
  }
  
  return {
    success: true,
    questionNumber: currentIndex + 1,
    hasMoreQuestions,
    nextQuestionNumber: hasMoreQuestions ? session.currentQuestionIndex + 1 : null
  };
}

/**
 * Get interview session details
 * @param {string} sessionId - Session ID
 * @returns {Object} Session details
 */
export function getSession(sessionId) {
  const session = interviewSessions.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  return session;
}

/**
 * Get all answers for a session
 * @param {string} sessionId - Session ID
 * @returns {Array} Array of answers
 */
export function getSessionAnswers(sessionId) {
  const session = interviewSessions.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  return session.answers;
}

/**
 * End an interview session
 * @param {string} sessionId - Session ID
 * @returns {Object} Session summary
 */
export async function endInterviewSession(sessionId, evaluation) {
  const session = interviewSessions.get(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  const completedAt = new Date();
  session.status = 'completed';
  session.completedAt = completedAt;

  // Persist completed session + evaluation to Firestore
  const db = getFirestore();
  if (db) {
    await db.collection('interviews').doc(sessionId).update({
      answers: session.answers,
      evaluation,
      status: 'completed',
      completedAt
    });
  }

  return {
    sessionId,
    totalQuestions: session.questions.length,
    answersSubmitted: session.answers.length,
    startedAt: session.startedAt,
    completedAt
  };
}

export function buildTranscriptFromSession(session) {
  return session.answers
    .map((a, i) => {
      return `Question ${i + 1}: ${a.question}\nAnswer: ${a.answer}`;
    })
    .join("\n\n");
}
