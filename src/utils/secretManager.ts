import axios from 'axios';

// Define the Firebase Cloud Function URL (replace with your function's URL)
const FIREBASE_FUNCTION_URL = 'https://us-central1-sleepmusicapp-413415.cloudfunctions.net/getSecretValue';

// Function to call Firebase Cloud Function to get secrets
export const getSecretValue = async (secretName: string): Promise<string | null> => {
  try {
    
    // Make a GET request to your Firebase Cloud Function
    const response = await axios.get(`${FIREBASE_FUNCTION_URL}?name=${secretName}`);
    
    // Extract the secret from the response data
    const secretPayload = response.data.secret;
    
    if (!secretPayload) {
      return null;
    }
    return secretPayload;
    
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error.message);
    throw error;
  }
};