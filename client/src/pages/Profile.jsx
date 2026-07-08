import { motion } from 'framer-motion';
import { User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md p-8 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl text-left"
      >
        <div className="flex justify-center mb-4">
          <div className="inline-flex p-3 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]">
            <User className="w-8 h-8" />
          </div>
        </div>

        <h3 className="font-display font-bold text-xl text-[#FFFFFF] text-center mb-6">
          My Account Profile
        </h3>

        {user && (
          <div className="space-y-4 border-t border-[#27272A] pt-4 text-sm">
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase">Full Name</span>
              <div className="text-[#FFFFFF] font-semibold mt-0.5">{user.fullName}</div>
            </div>
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase">Username</span>
              <div className="text-[#FFFFFF] font-medium mt-0.5">{user.username}</div>
            </div>
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase">Email Address</span>
              <div className="text-[#FFFFFF] mt-0.5">{user.email}</div>
            </div>
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase">Permission Role</span>
              <div className="text-[#F97316] font-mono font-bold mt-0.5 flex items-center gap-1.5">
                <Shield className="w-4 h-4 shrink-0" />
                <span>{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
