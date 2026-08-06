import { apiGet, apiPost, type ApiOpts } from './api-client';

export type FeedbackQuestionType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'rating5'
  | 'nps'
  | 'single'
  | 'multi'
  | 'sam';

export type FeedbackQuestion = {
  id: string;
  section: number;
  label: string;
  type: FeedbackQuestionType;
  required: boolean;
  options?: string[];
  allowOther?: boolean;
  isRating?: boolean;
  showIf?: { questionId: string; in: string[] };
  help?: string;
};

export type FeedbackForm = {
  sections: { id: number; title: string }[];
  steps: { title: string; sections: number[] }[];
  questions: FeedbackQuestion[];
  ratingLabels: Record<string, string>;
  sams: { id: string; name: string }[];
};

export type FeedbackAnswers = Record<string, string | number | string[]>;

export type SubmitResult = {
  id: string;
  overallScore: number | null;
  interestLevel: string | null;
};

export type FeedbackListRow = {
  id: string;
  customerName: string;
  companyName: string;
  overallScore: number | null;
  interestLevel: string | null;
  npsScore: number | null;
  submittedAt: string;
  sam: { id: string; name: string };
};

export type FeedbackDetail = {
  id: string;
  customerName: string;
  companyName: string;
  sam: { id: string; name: string; email: string };
  responses: FeedbackAnswers;
  overallScore: number | null;
  interestLevel: string | null;
  npsScore: number | null;
  submittedAt: string;
  questions: FeedbackQuestion[];
  ratingLabels: Record<string, string>;
};

// ── Public ──────────────────────────────────────────────────────────────────
export function getFeedbackForm(opts: ApiOpts = {}) {
  return apiGet<FeedbackForm>('/feedback/form', opts);
}

export function submitFeedback(responses: FeedbackAnswers) {
  return apiPost<SubmitResult>('/feedback', { responses });
}

// ── Admin ───────────────────────────────────────────────────────────────────
export function listFeedbacks(opts: ApiOpts = {}) {
  return apiGet<{ feedbacks: FeedbackListRow[] }>('/feedback', opts);
}

export function getFeedback(id: string, opts: ApiOpts = {}) {
  return apiGet<FeedbackDetail>(`/feedback/${id}`, opts);
}
