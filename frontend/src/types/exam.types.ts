// Exam Types
export type ExamStatus = 'draft' | 'published' | 'archived';
export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted';

export interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  created_by: number;
  created_by_name?: string;
  is_active: boolean;
  exam_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  course: number;
  course_name?: string;
  course_code?: string;
  created_by: number;
  created_by_name?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_results_immediately: boolean;
  allow_review: boolean;
  max_attempts: number;
  start_time?: string;
  end_time?: string;
  status: ExamStatus;
  is_active: boolean;
  question_count: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExamData {
  title: string;
  description: string;
  course: number;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  show_results_immediately?: boolean;
  allow_review?: boolean;
  max_attempts?: number;
  start_time?: string;
  end_time?: string;
  status?: ExamStatus;
}

export interface ExamAttempt {
  id: number;
  exam: number;
  exam_title: string;
  student: number;
  student_name: string;
  attempt_number: number;
  status: AttemptStatus;
  start_time: string;
  end_time?: string;
  submit_time?: string;
  score?: number;
  percentage?: number;
  time_remaining: number;
  is_timed_out: boolean;
  last_activity: string;
  total_marks?: number;
  duration_minutes?: number;
  result_id?: number;
}

export interface CreateAttemptData {
  exam: number;
}

export interface AttemptQuestionsResponse {
  questions: Question[];
  time_remaining: number;
  attempt_id: number;
}

export interface Question {
  id: number;
  question_type: 'mcq' | 'true_false' | 'short_answer';
  text: string;
  image?: string;
  marks: number;
  order: number;
  options: Option[];
}

export interface Option {
  id: number;
  text: string;
  order: number;
  is_correct?: boolean;
}

export interface StudentAnswer {
  id?: number;
  attempt: number;
  question: number;
  selected_option?: number;
  answer_text?: string;
}

export interface SubmitAnswerData {
  attempt: number;
  question: number;
  selected_option?: number;
  answer_text?: string;
}

export interface ExamResult {
  id: number;
  attempt: number;
  exam_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  grade?: string;
  passed: boolean;
  completed_at: string;
  feedback?: string;
}

export interface ExamAttempt {
  id: number;
  exam: number;
  exam_title: string;
  student: number;
  student_name: string;
  status: 'in_progress' | 'submitted' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  submit_time?: string;
  score?: number;
  percentage?: number;
  total_marks: number;
  duration_minutes: number;
  result_id?: number;
}