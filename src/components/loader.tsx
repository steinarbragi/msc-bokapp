import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <motion.div
      className='relative flex items-center justify-center'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className='h-20 w-20 bg-gradient-to-br from-[#fc00ff] to-[#00dbde] p-1'
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
          borderRadius: ['15%', '50%', '15%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className='absolute -inset-16 -z-10 animate-pulse'>
          <div className='h-full w-full rounded-full bg-gradient-to-br from-[#fc00ff] to-[#00dbde] opacity-60 blur-[100px]' />
        </div>
      </motion.div>
    </motion.div>
  );
}
