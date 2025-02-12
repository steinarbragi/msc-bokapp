import { motion } from 'framer-motion';
import { Control, Controller } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import { Question, FormValues } from '../../types';

interface MultipleChoiceQuestionProps {
  question: Question;
  control: Control<FormValues>;
}

export function MultipleChoiceQuestion({
  question,
  control,
}: MultipleChoiceQuestionProps) {
  return (
    <div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className='to-navy-600 mb-6 bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-xl text-transparent'
      >
        Þú getur valið fleiri en eitt svar!
      </motion.p>
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
                <div className='relative w-full'>
                  <input
                    type='text'
                    placeholder='Annað... (skrifa eigið svar)'
                    className={`w-full rounded-xl border-2 p-4 pr-12 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                      ((field.value as string[]) || []).find(
                        v => !question.options?.includes(v)
                      )
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 bg-white'
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
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4'>
                    <Pencil className='h-6 w-6 text-gray-400' />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}
