import { motion } from 'framer-motion';
import { RefreshCw, Database } from 'lucide-react';

const Synchronization = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md p-8 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl"
      >
        <div className="inline-flex p-3 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>

        <h3 className="font-display font-bold text-xl text-[#FFFFFF] mb-2">
          Smart City Synchronization
        </h3>
        <p className="text-sm text-[#A1A1AA] mb-6 leading-relaxed">
          The replication and synchronization module triggers and logs automated data transmissions with the centralized metropolitan transit hub.
        </p>

        <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#A1A1AA] font-mono flex items-center gap-2.5 justify-center">
          <Database className="w-4 h-4 text-[#F97316] animate-pulse" />
          <span>Module Placeholder Activated</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Synchronization;
