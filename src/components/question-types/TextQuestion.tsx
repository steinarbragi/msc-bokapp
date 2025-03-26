import { Control, Controller } from 'react-hook-form';
import { FormValues } from '../../app/spurningar/types';

interface TextQuestionProps {
  control: Control<FormValues>;
  name: string;
}

export function TextQuestion({ control, name }: TextQuestionProps) {
  return (
    <Controller<FormValues>
      name={name}
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
