export type LoginPayload = {
  email: string;
  password: string;
};

export type GetContactIdPayload = {
  email: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type CreateContactsPayload = {
  email: string;
  fields: {
    slug: string;
    value: string;
  }[];
};

export type TagSetContactsIdPayload = {
  contactId?: string;
  tagId: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type GetUserTagPayload = {
  email: string;
};

export type GetCoursesPayload = {
  email: string;
};

export type GetCoursesSectionsPayload = {
  id: string | undefined;
  email: string;
  token: string;
};

export type GetSleepMusicByCategoryPayload = {
  categoryId: string;
  token: string;
};

export type GetSleepMusicPreviewPayload = {
  categoryId: string;
};

export type GetGuidedMeditationPayload = {
  email: string;
  token:string
  page: number;
  limit: number;
};

export type GetChakraPayload = {
  email: string;
  page: number;
  limit: number;
};

export type GetMantraPayload = {
  email: string;
  page: number;
  limit: number;
};

export type AddFavoritesPayload = {
  musicId: string;
  token: string;
};

export type DeleteContactsPayload = {
  contactsId: string;
};

export type DeleteUserPayload = {
  token: string;
};

export type UserTagSystemeIoPayload = {
  contactsId: string;
};

export type UpdateCoursesProgressPayload = {
  coursesId: string | undefined;
  sectionsId: string | undefined;
  lessonsId: string | undefined;
  token: string;
  watchTimeInSeconds: number;
};

export type CoursesCompletePayload = {
  coursesId: string | undefined;
  sectionsId: string | undefined;
  lessonsId: string | undefined;
  token: string;
};

export type GetMyProgressPayload = {
  token: string;
};

// Chat Payload Types
export interface PostChatMessagePayload {
  message: string;
  userEmail: string;
  sessionId: string;
}

export interface GetChatHistoryPayload {
  sessionId: string;
  userEmail?: string;
  limit?: number;
}

export interface GetChatSessionsPayload {
  userEmail: string;
}

export interface GetChatAnalyticsPayload {
  userEmail: string;
}

export interface GetChatFaqPayload {
  category: string;
}
