import { motion } from 'framer-motion';
import { Control, Controller } from 'react-hook-form';
import { Question, FormValues } from '../../app/spurningar/types';

interface SingleChoiceQuestionProps {
  question: Question;
  control: Control<FormValues>;
  onNextStep?: () => void;
  name: string;
}

export function SingleChoiceQuestion({
  question,
  control,
  onNextStep,
  name,
}: SingleChoiceQuestionProps) {
  return (
    <Controller<FormValues>
      name={name}
      control={control}
      render={({ field }) => (
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
            question.options && question.options.length > 6
              ? 'lg:grid-cols-3'
              : 'lg:grid-cols-2'
          }`}
        >
          {question.options?.map(option => (
            <motion.button
              key={option}
              type='button'
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
}
