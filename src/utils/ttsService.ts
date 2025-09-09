import { GROQ_API_KEY } from '@env';

const TTS_API_URL = 'https://api.groq.com/openai/v1/audio/speech';
const TTS_MODEL = 'playai-tts';
const TTS_VOICE = 'Angelo-PlayAI'; // Changed to a valid voice from error message
const TTS_RESPONSE_FORMAT = 'wav';

/**
 * Sends text to Groq TTS API to generate speech audio.
 * @param text The text to convert to speech.
 * @returns A Base64 encoded Data URL string of the audio data (e.g., "data:audio/wav;base64,...").
 * @throws If the API call fails, the API key is missing, or audio processing fails.
 */
export const fetchSpeechAudioDataUrl = async (text: string): Promise<string> => {
  /* // --- DUMMY TEST: Simulate Quota Error ---
  console.log('DUMMY TEST: Simulating TTS 429 Quota Error for text:', text);
  throw new Error('TTS API Error: 429 - Dummy quota exceeded');
  // --- End DUMMY TEST --- */

  console.log('Requesting TTS audio for text:', text);

  const apiKey = GROQ_API_KEY as string;
  if (!apiKey) {
    console.error('Groq API key not found for TTS');
    throw new Error('API configuration error.');
  }

  try {
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: text,
        voice: TTS_VOICE,
        response_format: TTS_RESPONSE_FORMAT,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq TTS API Error Response:', errorData);
      throw new Error(`Groq TTS API Error: ${response.status} - ${errorData}`);
    }

    // --- Handle Audio Data ---
    const audioBlob = await response.blob();

    // Use a Promise to handle FileReader's async nature
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const audioDataUrl = e.target?.result as string;
        if (audioDataUrl) {
          console.log('Audio Data URL created successfully.');
          resolve(audioDataUrl);
        } else {
          console.error('Failed to read audio blob as Data URL');
          reject(new Error('Failed to process audio data.'));
        }
      };
      fileReader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Failed to read audio data.'));
      };
      fileReader.readAsDataURL(audioBlob);
    });

  } catch (error) {
    console.error('Error during TTS fetch process:', error);
    // Re-throw the error so the caller can handle it
    throw error;
  }
}; 