import { GROQ_API_KEY } from '@env';

const STT_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const STT_MODEL = 'whisper-large-v3-turbo'; // Or choose your preferred model

/**
 * Sends audio file URI to Groq STT API for transcription.
 * @param fileUri The URI of the audio file to transcribe.
 * @returns The transcribed text.
 * @throws If the API call fails or the API key is missing.
 */
export const transcribeAudioWithGroq = async (fileUri: string): Promise<string> => {
  /* // --- DUMMY TEST: Simulate Quota Error ---
  console.log('DUMMY TEST: Simulating STT 429 Quota Error');
  throw new Error('STT API Error: 429 - Dummy quota exceeded');
  // --- End DUMMY TEST --- */

  console.log('Transcribing audio from URI:', fileUri);

  const apiKey = GROQ_API_KEY as string;
  if (!apiKey) {
    console.error('Groq API key not found for STT');
    throw new Error('API configuration error.');
  }

  const formData = new FormData();
  // Determine file type/name based on URI if possible, default for now
  const filename = fileUri.split('/').pop() || 'recording.m4a';
  // Correctly determine MIME type based on extension
  let type = 'audio/m4a'; // Default
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'wav') {
      type = 'audio/wav';
  } else if (extension === 'mp3') {
      type = 'audio/mpeg';
  } // Add other supported types as needed (flac, mp4, mpeg, mpga, ogg, webm)
    else if (['mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'webm', 'flac'].includes(extension || '')) {
      type = `audio/${extension}`;
  }

  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: type,
  } as any); // Use 'as any' for FormData compatibility in React Native

  formData.append('model', STT_MODEL);
  formData.append('response_format', 'json'); // Request JSON response to get text

  try {
    console.log('Sending audio to Groq STT:', STT_API_URL);
    const response = await fetch(STT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // 'Content-Type': 'multipart/form-data' // Set automatically by fetch for FormData
      },
      body: formData,
    });

    const responseBody = await response.json(); // Always try to parse JSON

    if (!response.ok) {
       console.error('Groq STT API Error Response:', responseBody);
       throw new Error(`STT API Error: ${response.status} - ${JSON.stringify(responseBody)}`);
    }

    console.log('Groq STT Result:', responseBody);

    if (typeof responseBody.text === 'string') {
        return responseBody.text;
    } else {
        console.error('Unexpected STT response format:', responseBody);
        throw new Error('Failed to parse transcription from API response.');
    }

  } catch (error) {
    console.error('Failed to transcribe audio:', error);
    // Re-throw the error so the caller can handle it (e.g., update UI)
    throw error;
  }

}; 