type QuestionType = 'text' | 'multiple-choice' | 'slider' | 'single-choice';

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  key: string;
  options?: string[];
  allowTextInput?: boolean;
}

export type FormValues = {
  [key: `question${number}`]: string | string[];
};
