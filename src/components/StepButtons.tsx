import { Question } from '../app/spurningar/types';

interface StepButtonsProps {
  questions: Question[];
  currentStep: number;
  answers: Record<string, unknown>;
  onStepClick: (index: number) => void;
}

export function StepButtons({
  questions,
  currentStep,
  answers,
  onStepClick,
}: StepButtonsProps) {
  const isAnswered = (questionKey: string) => {
    const answer = answers[questionKey];
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    if (typeof answer === 'string') {
      return answer.trim() !== '';
    }
    return !!answer;
  };

  return (
    <div className='flex flex-wrap gap-1.5 sm:gap-2'>
      {questions.map((question, index) => (
        <button
          key={index}
          onClick={() => onStepClick(index)}
          type='button'
          className={`h-7 w-7 rounded-full sm:h-8 sm:w-8 ${
            index === currentStep
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : isAnswered(question.key)
                ? 'bg-purple-500 text-white'
                : index < currentStep
                  ? 'bg-white/80 text-purple-600'
                  : 'bg-white/50 text-gray-600'
          } flex items-center justify-center text-sm font-medium transition-all hover:scale-105 sm:text-base`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
