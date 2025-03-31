import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

interface NavigationButtonsProps {
  isLastQuestion: boolean;
  isComplete: boolean;
  currentAnswer: unknown;
  onNextStep: () => void;
  submitButtonText: string;
  isLoading: boolean;
}

export function NavigationButtons({
  isLastQuestion,
  isComplete,
  currentAnswer,
  onNextStep,
  submitButtonText,
  isLoading,
}: NavigationButtonsProps) {
  const hasAnswer =
    typeof currentAnswer === 'string'
      ? currentAnswer !== ''
      : Array.isArray(currentAnswer)
        ? currentAnswer.length > 0
        : currentAnswer != null;

  const shouldShowNext = !isLastQuestion && !isComplete && hasAnswer;
  const shouldShowSkip = !isLastQuestion && !isComplete && !hasAnswer;
  const shouldShowSubmit = isComplete || isLastQuestion;

  return (
    <>
      {shouldShowSkip && (
        <button
          type='button'
          onClick={onNextStep}
          className='mt-3 w-full rounded-xl border-2 border-gray-200 p-2.5 text-gray-500 transition-all hover:scale-[1.02] hover:border-gray-300 hover:text-gray-700 sm:mt-4 sm:p-3'
        >
          Sleppa spurningu
        </button>
      )}

      {shouldShowNext && (
        <motion.button
          type='button'
          onClick={onNextStep}
          className='mt-3 w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-2.5 text-white transition-all hover:scale-[1.02] hover:shadow-lg sm:mt-4 sm:p-3'
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Áfram
        </motion.button>
      )}

      {shouldShowSubmit && (
        <motion.button
          type='submit'
          className='mt-6 flex w-full justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:mt-8 sm:px-10 sm:py-4 sm:text-xl'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? <Loader className='animate-spin' /> : submitButtonText}
        </motion.button>
      )}
    </>
  );
}
