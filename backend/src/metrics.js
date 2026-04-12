import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics();

export const interviewsStarted = new Counter({
  name: 'interviews_started_total',
  help: 'Total interviews started',
});

export const interviewsCompleted = new Counter({
  name: 'interviews_completed_total',
  help: 'Total interviews completed',
});

export const activeSessions = new Gauge({
  name: 'active_interview_sessions',
  help: 'Current in-memory interview sessions',
});

export const geminiLatency = new Histogram({
  name: 'gemini_request_duration_seconds',
  help: 'Gemini API call duration in seconds',
  labelNames: ['operation'],
  buckets: [0.5, 1, 2, 5, 10, 20],
});

export const elevenLabsTTSLatency = new Histogram({
  name: 'elevenlabs_tts_duration_seconds',
  help: 'ElevenLabs TTS call duration in seconds',
  buckets: [0.5, 1, 2, 5, 10],
});

export const elevenLabsSTTLatency = new Histogram({
  name: 'elevenlabs_stt_duration_seconds',
  help: 'ElevenLabs STT call duration in seconds',
  buckets: [0.5, 1, 2, 5, 10],
});

export { register };
