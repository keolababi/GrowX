export type FeedbackQuestionType =
  'SHORT_ANSWER' | 'LONG_ANSWER' | 'MULTIPLE_CHOICE' | 'CHECKBOXES' | 'RATING' | 'SCALE' | 'YES_NO';

export type FeedbackQuestion = {
  id: string;
  type: FeedbackQuestionType;
  label: string;
  options: string[] | null;
  required: boolean;
  order: number;
};

export type FeedbackFormSummary = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  questionCount: number;
  responseCount: number;
};

export type CommunityFeedbackFormSummary = FeedbackFormSummary & {
  respondedByMe: boolean;
  author: FeedbackFormAuthor;
};

export type FeedbackFormAuthor = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type FeedbackFormDetail = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  author: FeedbackFormAuthor;
  isOwner: boolean;
  responseCount: number;
  respondedByMe: boolean;
  questions: FeedbackQuestion[];
};

export type FeedbackAnswerInput = {
  questionId: string;
  textValue?: string;
  optionsValue?: string[];
};

export type FeedbackResponseAnswer = {
  questionId: string;
  textValue: string | null;
  optionsValue: string[] | null;
};

export type FeedbackResponseSummary = {
  id: string;
  createdAt: string;
  respondent: FeedbackFormAuthor;
  answers: FeedbackResponseAnswer[];
};

export type FeedbackResponsesPayload = {
  questions: { id: string; type: FeedbackQuestionType; label: string; options: string[] | null }[];
  responses: FeedbackResponseSummary[];
};
