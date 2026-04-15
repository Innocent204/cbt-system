// Result Types
export interface Result {
  id: number;
  attempt: number;
  exam: number;
  exam_title?: string;
  student: number;
  student_name?: string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  is_passed: boolean;
  grade: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  time_taken_minutes: number;
  generated_at: string;
  answers?: AnswerDetail[];
}

export interface AnswerDetail {
  id: number;
  attempt: number;
  question: number;
  question_text: string;
  question_marks: number;
  selected_option?: number;
  answer_text?: string;
  is_correct?: boolean;
  marks_obtained: number;
  is_marked_for_review: boolean;
  answered_at: string;
}