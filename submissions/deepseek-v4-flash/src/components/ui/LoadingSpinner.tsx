import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <motion.div
        className={`${dims[size]} rounded-full border-2 border-gray-700 border-t-red-500`}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-4 animate-pulse">
      <div className="aspect-square rounded-xl bg-gray-800 mb-3" />
      <div className="h-3 w-12 bg-gray-800 rounded mb-2" />
      <div className="h-5 w-32 bg-gray-800 rounded mb-3" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-800 rounded-full" />
        <div className="h-6 w-16 bg-gray-800 rounded-full" />
      </div>
    </div>
  );
}
