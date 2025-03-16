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
  const isAnswered = (questionId: string) => {
    const answer = answers[`question${questionId}`];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return !!answer;
  };

  return (
    <div className='flex flex-wrap gap-2'>
      {questions.map((question, index) => (
        <button
          key={index}
          onClick={() => onStepClick(index)}
          type='button'
          className={`h-8 w-8 rounded-full ${
            index === currentStep
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : isAnswered(question.id.toString())
                ? 'bg-purple-500 text-white'
                : index < currentStep
                  ? 'bg-white/80 text-purple-600'
                  : 'bg-white/50 text-gray-600'
          } flex items-center justify-center font-medium transition-all hover:scale-105`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
