import { Control } from 'react-hook-form';
import { Question, FormValues } from '../types';
import { MultipleChoiceQuestion } from './question-types/MultipleChoiceQuestion';
import { SingleChoiceQuestion } from './question-types/SingleChoiceQuestion';
import { TextQuestion } from './question-types/TextQuestion';

interface QuestionContentProps {
  question: Question;
  control: Control<FormValues>;
  onNextStep?: () => void;
  name: string;
}

export function QuestionContent({
  question,
  control,
  onNextStep,
}: QuestionContentProps) {
  switch (question.type) {
    case 'multiple-choice':
      return <MultipleChoiceQuestion question={question} control={control} />;

    case 'single-choice':
      return (
        <SingleChoiceQuestion
          question={question}
          control={control}
          onNextStep={onNextStep}
        />
      );

    case 'text':
      return <TextQuestion question={question} control={control} />;

    default:
      return null;
  }
}
