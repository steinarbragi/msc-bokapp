import { motion } from 'framer-motion';
import { Control, Controller } from 'react-hook-form';
import { Question } from '../types';
import { FormValues } from '../types';

interface QuestionContentProps {
  question: Question;
  control: Control<FormValues>;
  onNextStep?: () => void;
}

export function QuestionContent({
  question,
  control,
  onNextStep,
}: QuestionContentProps) {
  switch (question.type) {
    case 'multiple-choice':
      return (
        <Controller<FormValues>
          name={`question${question.id}`}
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <div className='flex flex-col gap-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {question.options?.map(option => (
                  <motion.button
                    key={option}
                    onClick={() => {
                      const currentValues = (field.value as string[]) || [];
                      const newValues = currentValues.includes(option)
                        ? currentValues.filter(v => v !== option)
                        : [...currentValues, option];
                      field.onChange(newValues.length > 0 ? newValues : []);
                    }}
                    className={`w-full rounded-xl border-2 ${
                      ((field.value as string[]) || []).includes(option)
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200'
                    } p-4 text-left`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option}
                  </motion.button>
                ))}
                {question.allowTextInput && (
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      placeholder='Annað...'
                      className={`flex-1 rounded-xl border-2 p-4 ${
                        ((field.value as string[]) || []).find(
                          v => !question.options?.includes(v)
                        )
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200'
                      }`}
                      value={
                        ((field.value as string[]) || []).find(
                          v => !question.options?.includes(v)
                        ) || ''
                      }
                      onChange={e => {
                        const currentValues = (field.value as string[]) || [];
                        const customValue = currentValues.find(
                          v => !question.options?.includes(v)
                        );
                        const newValues = customValue
                          ? currentValues.filter(v => v !== customValue)
                          : currentValues;
                        if (e.target.value) {
                          newValues.push(e.target.value);
                        }
                        field.onChange(newValues);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        />
      );

    case 'single-choice':
      return (
        <Controller<FormValues>
          name={`question${question.id}`}
          control={control}
          render={({ field }) => (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {question.options?.map(option => (
                <motion.button
                  key={option}
                  onClick={() => {
                    const newValue = field.value === option ? '' : option;
                    field.onChange(newValue);
                    if (newValue && onNextStep) {
                      onNextStep();
                    }
                  }}
                  className={`w-full rounded-xl border-2 ${
                    field.value === option
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200'
                  } p-4 text-left`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          )}
        />
      );

    case 'text':
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

    default:
      return null;
  }
}
