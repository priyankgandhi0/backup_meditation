import { QAItem, TopicQAData } from '../types/chatbot'; // Import necessary types

// Import all individual FAQ arrays
import { GeneralFAQs } from './GeneralFAQs';
import { MembershipFAQs } from './MembershipFAQs';
import { CourseFAQs } from './CourseFAQs';
import { AppFAQs } from './AppFAQs';
import { TechnicalFAQs } from './TechnicalFAQs';

// 1. Export the combined array for general searching (used by qaHandler.ts)
export const knowledgeBase: QAItem[] = [
  ...GeneralFAQs,
  ...MembershipFAQs,
  ...CourseFAQs,
  ...AppFAQs,
  ...TechnicalFAQs
];

// 2. Export the topic-based structure for category browsing (used by ChatbotWindow.tsx)
export const TOPIC_QA: TopicQAData = {
  "General FAQs": GeneralFAQs,
  "Membership FAQs": MembershipFAQs,
  "Course FAQs": CourseFAQs,
  "App FAQs": AppFAQs,
  "Technical FAQs": TechnicalFAQs,
  "Other Topics": [], // Keep this if needed, or populate later
}; 