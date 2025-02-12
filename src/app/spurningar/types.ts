export interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'slider' | 'text' | 'single-choice';
  options?: string[];
  allowTextInput?: boolean;
}

export type FormValues = {
  [key: `question${number}`]: string | string[];
};
