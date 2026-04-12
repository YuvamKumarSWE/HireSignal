import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { elevenLabsTTSLatency, elevenLabsSTTLatency } from '../metrics.js';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Available interviewer voices with their characteristics
const INTERVIEWER_VOICES = [
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    description: 'Professional and warm male voice',
    gender: 'male'
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: 'Deep and authoritative male voice',
    gender: 'male'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    description: 'Clear and friendly female voice',
    gender: 'female'
  },
  {
    id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    description: 'Confident and energetic male voice',
    gender: 'male'
  },
  {
    id: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    description: 'Calm and professional male voice',
    gender: 'male'
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    description: 'Warm and supportive female voice',
    gender: 'female'
  }
];

// Default voice ID (fallback)
const DEFAULT_VOICE_ID = INTERVIEWER_VOICES[0].id;

/**
 * Get a random voice from the available interviewer voices
 * @returns {Object} Voice object with id, name, and description
 */
export function getRandomVoice() {
  const randomIndex = Math.floor(Math.random() * INTERVIEWER_VOICES.length);
  return INTERVIEWER_VOICES[randomIndex];
}

/**
 * Get all available voices
 * @returns {Array} Array of voice objects
 */
export function getAllVoices() {
  return INTERVIEWER_VOICES;
}

// Lazy-initialize ElevenLabs client
let elevenlabsClient = null;
function getElevenLabsClient() {
  if (!elevenlabsClient) {
    elevenlabsClient = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY
    });
  }
  return elevenlabsClient;
}

/**
 * Convert text to speech using ElevenLabs API
 * @param {string} text - The text to convert to speech
 * @param {string} voiceId - Optional voice ID (defaults to George)
 * @returns {Buffer} Audio buffer
 */
export async function textToSpeech(text, voiceId = DEFAULT_VOICE_ID) {
  const end = elevenLabsTTSLatency.startTimer();
  try {
    const client = getElevenLabsClient();
    
    // Use the official SDK method
    const audio = await client.textToSpeech.convert(voiceId, {
      text: text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    // Convert the stream to a buffer
    const chunks = [];
    const reader = audio.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    end();
    return Buffer.concat(chunks);
  } catch (error) {
    end();
    console.error('ElevenLabs TTS Error:', error);
    throw new Error('Failed to convert text to speech');
  }
}

/**
 * Convert speech to text using ElevenLabs Speech to Text API
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} languageCode - Language code (optional, auto-detect if not provided)
 * @returns {string} Transcribed text
 */
export async function speechToText(audioBuffer, languageCode = null) {
  const end = elevenLabsSTTLatency.startTimer();
  try {
    const elevenlabs = getElevenLabsClient();
    
    // Create a Blob from the buffer
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    
    const transcription = await elevenlabs.speechToText.convert({
      file: audioBlob,
      modelId: 'scribe_v2', // ElevenLabs Speech to Text model
      tagAudioEvents: true, // Tag audio events like laughter, applause, etc.
      languageCode: languageCode, // Language of the audio file. If null, auto-detect
      diarize: false // Whether to annotate who is speaking (false for single speaker)
    });

    // Extract the transcription text
    end();
    return transcription.text || '';
  } catch (error) {
    end();
    console.error('ElevenLabs Speech to Text Error:', error.response?.data || error.message);
    throw new Error('Failed to convert speech to text');
  }
}
