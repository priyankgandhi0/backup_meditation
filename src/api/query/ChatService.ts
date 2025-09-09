import { useQuery, useMutation, UseQueryResult, UseMutationResult, QueryClient, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { axiosInstance } from '../apiClient'; // Use the main instance for chat temporarily based on interceptor
import { API_ENDPOINT } from '../ApiEndPoint'; 
import {
  PostChatMessagePayload,
  GetChatHistoryPayload,
  GetChatSessionsPayload,
  GetChatAnalyticsPayload,
  GetChatFaqPayload,
} from '../ApiPayloadType';

// --- Define Response Types --- (Adjust based on actual API)
interface PostChatResponse {
  id?: string;
  text: string;
  isUser?: boolean;
  hasAudio?: boolean;
  backgroundColor?: string;
  sessionId: string;
}
type ChatHistoryItem = { id: string; text: string; isUser: boolean; timestamp?: string }; 
type ChatSessionItem = { id: string; name?: string; lastActivity?: string };
// Assuming ChatTopic and ChatFAQ types are defined globally or in ChatbotWindow.tsx
type ChatTopic = { id: string | number; title: string; color?: string; category: string; };
type ChatFAQ = { id?: string | number; question: string; answer: string; backgroundColor?: string };

// --- TanStack Query Hooks (Following CouresService.ts structure) ---

// Hook for posting messages
export const usePostChatMessage = (): UseMutationResult<PostChatResponse, Error, PostChatMessagePayload> => {
  return useMutation({
    mutationFn: async (payload: PostChatMessagePayload) => {
      const response = await axiosInstance.post<PostChatResponse>(API_ENDPOINT.CHAT_POST_MESSAGE, payload);
      return response.data; // Return unwrapped data
    },
    // Add onSuccess, onError, etc. here if needed
  });
};

// Hook for getting chat history
export const useGetChatHistory = (
  params: GetChatHistoryPayload, // Requires sessionId, userEmail might be optional now
  options?: Omit<UseQueryOptions<ChatHistoryItem[], Error, ChatHistoryItem[], QueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<ChatHistoryItem[], Error> => {
  // Query key primarily depends on sessionId now
  const queryKey: QueryKey = ['chatHistory', params.sessionId]; // Removed other params from key
  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const { sessionId, ...query } = params; // Separate sessionId
      // Ensure sessionId is not empty/null before making the call
      if (!sessionId) {
          // Return empty array or throw error if sessionId is mandatory but missing
          console.warn('Attempted to fetch chat history without a session ID.');
          return []; 
      }
      // Use sessionId in the path again
      const response = await axiosInstance.get<ChatHistoryItem[]>(`${API_ENDPOINT.CHAT_GET_HISTORY}/${sessionId}`, { params: query });
      return response.data;
    },
    ...options,
    // Default enabled logic depends on sessionId again
    enabled: options?.enabled !== undefined ? options.enabled : !!params.sessionId,
  });
};

// Hook for getting chat sessions
export const useGetChatSessions = (
  params: GetChatSessionsPayload,
  options?: Omit<UseQueryOptions<ChatSessionItem[], Error, ChatSessionItem[], QueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<ChatSessionItem[], Error> => {
  const queryKey: QueryKey = ['chatSessions', params.userEmail];
  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
        const response = await axiosInstance.get<ChatSessionItem[]>(API_ENDPOINT.CHAT_GET_SESSIONS, { params });
        return response.data; // Return unwrapped data
    },
    ...options,
    enabled: options?.enabled !== undefined ? options.enabled : !!params.userEmail, 
  });
};

// Hook for getting chat analytics
export const useGetChatAnalytics = (
  params: GetChatAnalyticsPayload,
   options?: Omit<UseQueryOptions<any, Error, any, QueryKey>, 'queryKey' | 'queryFn'> // Using 'any' for unknown analytics structure
): UseQueryResult<any, Error> => {
  const queryKey: QueryKey = ['chatAnalytics', params.userEmail];
  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
        const response = await axiosInstance.get<any>(API_ENDPOINT.CHAT_GET_ANALYTICS, { params });
        return response.data; // Return unwrapped data
    },
    ...options,
    enabled: options?.enabled !== undefined ? options.enabled : !!params.userEmail, 
  });
};

// Hook for getting chat topics
export const useGetChatTopics = (
   options?: Omit<UseQueryOptions<ChatTopic[], Error, ChatTopic[], QueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<ChatTopic[], Error> => {
  const queryKey: QueryKey = ['chatTopics'];
  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
        const response = await axiosInstance.get<ChatTopic[]>(API_ENDPOINT.CHAT_GET_TOPICS);
        return response.data; // Return unwrapped data
    },
    ...options,
  });
};

// Hook for getting chat FAQs
export const useGetChatFaq = (
  params: GetChatFaqPayload,
  options?: Omit<UseQueryOptions<ChatFAQ[], Error, ChatFAQ[], QueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<ChatFAQ[], Error> => {
  const queryKey: QueryKey = ['chatFaq', params.category];
  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
        const response = await axiosInstance.get<ChatFAQ[]>(`${API_ENDPOINT.CHAT_GET_FAQ}/${params.category}`);
        return response.data; // Return unwrapped data
    },
    ...options,
    enabled: options?.enabled !== undefined ? options.enabled : !!params.category,
  });
}; 