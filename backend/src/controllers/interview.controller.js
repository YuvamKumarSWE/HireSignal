import {
  createInterviewSession,
  getNextQuestion,
  submitAnswer,
  getSession,
  getSessionAnswers,
  endInterviewSession,
  buildTranscriptFromSession
} from '../services/interview.service.js';
import { textToSpeech, speechToText } from '../services/elevenlabs.service.js';
import { evaluateWithGemini } from '../services/gemini.service.js';
import { getIO } from '../socket/index.js';

/**
 * Start a new interview session
 * POST /api/interview/start
 * Body: { role, level, jobDescription, company, userId }
 */
export async function startInterview(req, res) {
  try {
    const { role, level, jobDescription, company, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const jobSpec = {
      role: role || 'Software Engineer',
      level: level || 'Mid-level',
      jobDescription,
      company
    };

    const session = await createInterviewSession(jobSpec, userId);

    res.json({
      success: true,
      ...session,
      message: 'Interview session created successfully'
    });
  } catch (error) {
    console.error('Start Interview Error:', error);
    res.status(500).json({ 
      error: 'Failed to start interview',
      details: error.message 
    });
  }
}

/**
 * Get the next question in the interview
 * GET /api/interview/:sessionId/question
 */
export async function getCurrentQuestion(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const questionData = getNextQuestion(sessionId);

    res.json({
      success: true,
      ...questionData
    });
  } catch (error) {
    console.error('Get Question Error:', error);
    res.status(500).json({ 
      error: 'Failed to get question',
      details: error.message 
    });
  }
}

/**
 * Get question as audio (text-to-speech)
 * GET /api/interview/:sessionId/question/audio
 */
export async function getQuestionAudio(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const questionData = getNextQuestion(sessionId);
    
    if (questionData.completed) {
      return res.status(400).json({ 
        error: 'Interview completed',
        completed: true 
      });
    }

    // Get the session to retrieve the assigned voice
    const session = getSession(sessionId);
    const voiceId = session?.voice?.id;

    const audioBuffer = await textToSpeech(questionData.question, voiceId);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('Get Question Audio Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate question audio',
      details: error.message 
    });
  }
}

/**
 * Submit an answer (text)
 * POST /api/interview/:sessionId/answer
 * Body: { questionId, answer }
 */
export async function submitTextAnswer(req, res) {
  try {
    const { sessionId } = req.params;
    const { questionId, answer } = req.body;

    if (!sessionId || !questionId || !answer) {
      return res.status(400).json({ 
        error: 'sessionId, questionId, and answer are required' 
      });
    }

    const result = submitAnswer(sessionId, questionId, answer, 'text');

    res.json({
      success: true,
      ...result,
      message: 'Answer submitted successfully'
    });
  } catch (error) {
    console.error('Submit Answer Error:', error);
    res.status(500).json({ 
      error: 'Failed to submit answer',
      details: error.message 
    });
  }
}

/**
 * Submit an answer (audio)
 * POST /api/interview/:sessionId/answer/audio
 * Body: multipart/form-data with audio file and questionId
 */
export async function submitAudioAnswer(req, res) {
  try {
    const { sessionId } = req.params;
    const { questionId } = req.body;

    if (!sessionId || !questionId) {
      return res.status(400).json({ 
        error: 'sessionId and questionId are required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // Notify client that transcription is in progress
    const io = getIO();
    if (io) io.to(sessionId).emit('transcription:status', { status: 'processing' });

    // Convert audio to text
    const transcribedText = await speechToText(req.file.buffer);

    // Notify client transcription is done
    if (io) io.to(sessionId).emit('transcription:status', { status: 'done', text: transcribedText });

    // Submit the transcribed answer
    const result = submitAnswer(sessionId, questionId, transcribedText, 'audio');

    res.json({
      success: true,
      ...result,
      transcribedText,
      message: 'Audio answer submitted successfully'
    });
  } catch (error) {
    console.error('Submit Audio Answer Error:', error);
    res.status(500).json({ 
      error: 'Failed to submit audio answer',
      details: error.message 
    });
  }
}

/**
 * Get interview session details
 * GET /api/interview/:sessionId
 */
export async function getInterviewSession(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = getSession(sessionId);

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get Session Error:', error);
    res.status(500).json({ 
      error: 'Failed to get session',
      details: error.message 
    });
  }
}

/**
 * Get all answers for a session
 * GET /api/interview/:sessionId/answers
 */
export async function getAnswers(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const answers = getSessionAnswers(sessionId);

    res.json({
      success: true,
      sessionId,
      totalAnswers: answers.length,
      answers
    });
  } catch (error) {
    console.error('Get Answers Error:', error);
    res.status(500).json({ 
      error: 'Failed to get answers',
      details: error.message 
    });
  }
}

/**
 * End an interview session
 * POST /api/interview/:sessionId/end
 */
export async function endInterview(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = getSession(sessionId);

    // Build transcript
    const transcript = buildTranscriptFromSession(session);

    // Evaluate
    const evaluation = await evaluateWithGemini({
      transcript,
      role: session.jobSpec.role,
      level: session.jobSpec.level
    });

    // Push evaluation to client via WebSocket
    const io = getIO();
    if (io) io.to(sessionId).emit('evaluation:complete', { evaluation, transcript });

    res.json({
      success: true,
      sessionId,
      transcript,
      evaluation
    });
  } catch (error) {
    console.error("End Interview Error:", error);
    res.status(500).json({
      error: "Failed to end interview and evaluate"
    });
  }
}
