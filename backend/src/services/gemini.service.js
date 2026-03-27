import { GoogleGenerativeAI } from "@google/generative-ai";

export async function evaluateWithGemini({ transcript, role, level }) {
  const API_KEY = process.env.GEMINI_API_KEY;
  console.log("Evaluating with Gemini");
  if (!API_KEY) {
    console.warn("GEMINI_API_KEY is not set, using mock evaluation");
    return getMockEvaluation();
  }

  const prompt = buildEvaluationPrompt({ transcript, role, level });

  try {
    console.log("CALLING GEMINI API");
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API error:", error);
    console.warn("Using mock evaluation as fallback");
    return getMockEvaluation();
  }
}

function getMockEvaluation() {
  return {
    hire_probability: 0.72,
    strengths: [
      "Good communication skills",
      "Problem-solving ability",
      "Technical knowledge"
    ],
    weaknesses: [
      "Could improve depth in specific areas",
      "More real-world project experience would be beneficial"
    ],
    final_verdict: "Strong candidate with good potential. Recommend for further discussion."
  };
}

export function buildEvaluationPrompt({ transcript, role, level }) {
  return `
You are a senior interviewer at a top tech company.
Evaluate conservatively.

Transcript:
"""
${transcript}
"""

Role: ${role || "Software Engineer"}
Level: ${level || "New Grad"}

Return ONLY valid JSON:
{
  "hire_probability": number,
  "strengths": string[],
  "weaknesses": string[],
  "final_verdict": string
}
`;
}
