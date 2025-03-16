import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className='mb-8'>
      <div className='h-2 rounded-full bg-white/50'>
        <motion.div
          className='h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600'
          initial={{ width: 0 }}
          animate={{
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
