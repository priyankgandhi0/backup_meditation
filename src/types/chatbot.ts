export interface QAItem {
  id?: string | number;
  question: string;
  answer: string;
  backgroundColor?: string;
  keywords?: string[];
}

export interface TopicQAData {
  [key: string]: QAItem[];
} 