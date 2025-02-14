import { motion } from 'framer-motion';

interface NavigationButtonsProps {
  isLastQuestion: boolean;
  isComplete: boolean;
  currentAnswer: unknown;
  onNextStep: () => void;
  submitButtonText: string;
}

export function NavigationButtons({
  isLastQuestion,
  isComplete,
  currentAnswer,
  onNextStep,
  submitButtonText,
}: NavigationButtonsProps) {
  const hasAnswer =
    typeof currentAnswer === 'string'
      ? currentAnswer !== ''
      : Array.isArray(currentAnswer)
        ? currentAnswer.length > 0
        : currentAnswer != null;

  const shouldShowNext = !isLastQuestion && !isComplete && hasAnswer;
  const shouldShowSkip = !isLastQuestion && !isComplete && !hasAnswer;

  return (
    <>
      {shouldShowSkip && (
        <button
          type='button'
          onClick={onNextStep}
          className='mt-4 w-full rounded-xl border-2 border-gray-200 p-3 text-gray-500 transition-all hover:scale-[1.02] hover:border-gray-300 hover:text-gray-700'
        >
          Sleppa spurningu
        </button>
      )}

      {shouldShowNext && (
        <motion.button
          type='button'
          onClick={onNextStep}
          className='mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3 text-white transition-all hover:scale-[1.02] hover:shadow-lg'
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Áfram
        </motion.button>
      )}

      {(isComplete || isLastQuestion) && (
        <button
          type='submit'
          className='mt-8 flex w-full justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl'
        >
          {submitButtonText}
        </button>
      )}
    </>
  );
}
