import { Control, Controller } from 'react-hook-form';
import { Question, FormValues } from '../../app/spurningar/types';

interface TextQuestionProps {
  question: Question;
  control: Control<FormValues>;
}

export function TextQuestion({ question, control }: TextQuestionProps) {
  return (
    <Controller<FormValues>
      name={`question${question.id}`}
      control={control}
      render={({ field }) => (
        <input
          type='text'
          {...field}
          value={(field.value as string) || ''}
          className='w-full rounded-xl border-2 border-gray-200 p-4'
          placeholder='Skrifaðu svar hér...'
        />
      )}
    />
  );
}
