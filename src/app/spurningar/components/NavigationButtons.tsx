import { motion } from 'framer-motion';
import Link from 'next/link';

interface NavigationButtonsProps {
  isLastQuestion: boolean;
  isComplete: boolean;
  currentAnswer: string | string[];
  onNextStep: () => void;
  nextPageUrl: string;
  nextPageButtonText: string;
}

export function NavigationButtons({
  isLastQuestion,
  isComplete,
  currentAnswer,
  onNextStep,
  nextPageUrl,
  nextPageButtonText,
}: NavigationButtonsProps) {
  const shouldShowSkip =
    !isLastQuestion &&
    !isComplete &&
    (!currentAnswer ||
      (Array.isArray(currentAnswer) && currentAnswer.length === 0) ||
      currentAnswer === '');
  const shouldShowNext =
    !isLastQuestion &&
    !isComplete &&
    currentAnswer &&
    (!Array.isArray(currentAnswer) || currentAnswer.length > 0) &&
    currentAnswer !== '';

  return (
    <>
      {shouldShowSkip && (
        <button
          onClick={onNextStep}
          className='mt-4 w-full rounded-xl border-2 border-gray-200 p-3 text-gray-500 transition-all hover:scale-[1.02] hover:border-gray-300 hover:text-gray-700'
        >
          Sleppa spurningu
        </button>
      )}

      {shouldShowNext && (
        <motion.button
          onClick={onNextStep}
          className='mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3 text-white transition-all hover:scale-[1.02] hover:shadow-lg'
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Áfram
        </motion.button>
      )}

      {(isComplete || isLastQuestion) && (
        <Link
          href={nextPageUrl}
          className='mt-8 flex w-full justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl'
        >
          {nextPageButtonText}
        </Link>
      )}
    </>
  );
}
