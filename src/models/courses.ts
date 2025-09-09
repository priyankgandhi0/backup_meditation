export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  type: string;
  days: string;
  time: string;
  courseTheme: string;
  author: {
    name: string;
    bio: string;
    profileImage: string;
    _id: string;
  };
  accessTags: string[];
  hasAccess: boolean;
  progress: number;
} 