import * as FileSystem from 'expo-file-system';
import Fuse from 'fuse.js';
import Constants from 'expo-constants';
import { OPENAI_API_KEY } from '@env';

interface KnowledgeEntry {
  question: string;
  answer: string;
}

// Function to load and parse the knowledge base
async function loadKnowledgeBase(): Promise<KnowledgeEntry[]> {
  try {
    // Use static knowledge base for now
    const knowledgeBase = [
      {
        question: "What is The School of Breath?",
        answer: "The School of Breath is a comprehensive platform dedicated to teaching breathing techniques, meditation, and mindfulness practices to improve overall wellbeing. Founded by Abhi, we combine ancient yogic wisdom with modern neuroscience to offer transformative practices."
      },
      {
        question: "Who is Abhi?",
        answer: "Abhi (pronounced as Ah-bee) is a 43-year-old mental health expert and founder of Meditate with Abhi and The School of Breath. He blends ancient yogic wisdom with modern neuroscience to offer transformative practices in pranayama breathing, meditation, and sleep mastery."
      },
      {
        question: "What courses do you offer?",
        answer: "We offer several transformative courses including:
• 12-Day Breathwork for Third Eye Activation
• 9-Day Breathwork for Bliss & Fulfillment
• 9-Day Breathwork for Energy, Health and Vitality
• 9-Day Meditation Challenge
• Swara Yoga Breath Alignment
• Sleep Mastery Course"
      }
    ];
    return knowledgeBase;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return [];
  }
}

// Function to search the knowledge base using Fuse.js
function searchKnowledgeBase(entries: KnowledgeEntry[], query: string): KnowledgeEntry | null {
  const fuseOptions = {
    keys: ['question'],
    threshold: 0.4, // Lower threshold means stricter matching
    includeScore: true
  };

  const fuse = new Fuse(entries, fuseOptions);
  const results = fuse.search(query);

  // Return the best match if it exists and has a good score
  return results.length > 0 && results[0].score! < 0.4 ? results[0].item : null;
}

// Function to get answer from OpenAI
async function getOpenAIResponse(query: string): Promise<string> {
  try {
    // Get API key from environment
    const apiKey = OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not found');
      return "I apologize, but I'm having trouble accessing my knowledge base right now. Please try asking your question in a different way or try again later.";
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
      console.error('OpenAI API error:', errorData);
      return "I apologize, but I'm having trouble processing your question right now. Please try again later.";
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error getting OpenAI response:', error);
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try asking your question in a different way or try again later.";
  }
}

// Main handler function
export async function handleUserQuestion(query: string): Promise<string> {
  try {
    // First try to find an answer in the knowledge base
    const knowledgeBase = await loadKnowledgeBase();
    const localMatch = searchKnowledgeBase(knowledgeBase, query);

    if (localMatch) {
      return localMatch.answer;
    }

    // If no local match found, use OpenAI
    const openAIResponse = await getOpenAIResponse(query);
    return openAIResponse;
  } catch (error) {
    console.error('Error handling question:', error);
    return "I apologize, but I'm having trouble processing your question right now. Please try again later.";
  }
}

// Function to check if the response is pending
export function isResponsePending(response: string | null): boolean {
  return response === null;
} 