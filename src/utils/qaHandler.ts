import * as FileSystem from 'expo-file-system';
import Fuse from 'fuse.js';
import { GROQ_API_KEY } from '@env';
import { QAItem } from '../types/chatbot'; // Corrected import to use QAItem
import { knowledgeBase } from '../data/knowledgeBase'; // Import centralized knowledgeBase

// Function to search the knowledge base using Fuse.js
function searchKnowledgeBase(
  entries: QAItem[],
  query: string,
): Fuse.FuseResult<QAItem>[] { // Return Fuse results
  const options = {
    keys: ['question', 'answer', 'keywords'],
    includeScore: true,
    threshold: 0.4, // Adjust threshold for fuzziness (0.0 = exact match, 1.0 = match anything)
  };
  const fuse = new Fuse(entries, options);

  // console.log('Searching with query:', query);
  // console.log('Fuse index:', fuse);

  const results = fuse.search(query) as unknown as Fuse.FuseResult<QAItem>[];

  // console.log('Raw Fuse results:', results);

  if (results.length > 0) {
    // Return the raw Fuse results (up to 3)
    // No cast needed now if results is correctly typed
    return results.slice(0, 3);
  } else {
    // console.log('No relevant questions found.');
    // No cast needed now if results is correctly typed
    return [];
  }
}

// Function to get answer from Groq (previously OpenAI)
async function getGroqResponse(query: string): Promise<string> {
  try {
    // Get API key from environment - Add type assertion assuming it exists
    const apiKey = GROQ_API_KEY as string;
    
    if (!apiKey) {
      console.error('Groq API key not found');
      return "I apologize, but I'm having trouble accessing my knowledge base right now. Please try asking your question in a different way or try again later.";
    }

    // Use Groq API endpoint
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are Abhi, a 43-year-old mental health expert and founder of Meditate with Abhi and The School of Breath. You blend ancient yogic wisdom with modern neuroscience. Keep responses concise, warm, and focused on meditation, breathwork, and wellness."
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return "I apologize, but I'm having trouble processing your question right now. Please try again later.";
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    } else {
      console.error('Groq API response format error or empty content:', data);
      return "I apologize, but I received an unexpected response. Please try again.";
    }

  } catch (error) {
    console.error('Error getting Groq response:', error);
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try asking your question in a different way or try again later.";
  }
}

// Main handler function
export async function handleUserQuestion(query: string): Promise<string> {
  const greetingKeywords = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"];
  const lowerCaseQuery = query.toLowerCase().trim();
  if (greetingKeywords.includes(lowerCaseQuery)) {
    const greetings = ["Hello there! How can I help you today?", "Hi! What's on your mind?", "Hey! Ask me anything about The School of Breath."];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  try {
    // Search local knowledge base first
    const localMatchResults = searchKnowledgeBase(knowledgeBase, query); // Receives Fuse.FuseResult<QAItem>[]

    // console.log('Local match results:', localMatchResults);

    if (localMatchResults.length > 0 && localMatchResults[0].item) {
      // Extract the answer from the first match's item
      // console.log('Returning first local match answer:', localMatchResults[0].item.answer);
      return localMatchResults[0].item.answer;
    }

    // If no local match, proceed to API call
    // console.log('No local match found, calling API...');

    // If no local match found, use Groq
    const groqResponse = await getGroqResponse(query);
    return groqResponse;
  } catch (error) {
    console.error('Error handling question:', error);
    return "I apologize, but I'm having trouble processing your question right now. Please try again later.";
  }
}

// Function to check if the response is pending
export function isResponsePending(response: string | null): boolean {
  return response === null;
} 