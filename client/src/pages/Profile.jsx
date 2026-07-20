import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Mail,
  AtSign,
  Pencil,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormModal from '../layouts/common/FormModal';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState(null);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ---- Edit Full Name ----
  const startEditing = () => {
    setFullName(user?.fullName || '');
    setEditError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setEditError('Full name cannot be empty.');
      return;
    }

    setEditLoading(true);
    setEditError('');

    const result = await updateProfile(fullName.trim());

    if (result.success) {
      triggerSuccess('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setEditError(result.message);
    }

    setEditLoading(false);
  };

  // ---- Change Password ----
  const openPasswordModal = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setIsPasswordModalOpen(true);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters.';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setPasswordLoading(true);

    const result = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    if (result.success) {
      triggerSuccess('Password changed successfully!');
      setIsPasswordModalOpen(false);
    } else {
      setPasswordErrors({ form: result.message });
    }

    setPasswordLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-4">

      {/* Success banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl text-left"
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

            {/* Full Name — EDITABLE */}
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase">Full Name</span>

              {!isEditing ? (
                <div className="text-[#FFFFFF] font-semibold mt-0.5">{user.fullName}</div>
              ) : (
                <form onSubmit={handleSaveProfile} className="mt-1.5 space-y-2">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-white outline-none focus:border-[#F97316]/50"
                  />
                  {editError && (
                    <p className="text-[10px] text-[#EF4444] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{editError}</span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex-1 py-1.5 border border-[#27272A] text-[10px] text-[#A1A1AA] rounded-lg hover:bg-[#27272A]/30 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-[10px] font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {editLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Username — READ-ONLY, admin-managed */}
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase flex items-center gap-1.5">
                <AtSign className="w-3 h-3" /> Username
              </span>
              <div className="text-[#FFFFFF] font-medium mt-0.5 flex items-center gap-1.5">
                {user.username}
                <Lock className="w-3 h-3 text-[#A1A1AA]/50" />
              </div>
            </div>

            {/* Email — READ-ONLY, admin-managed */}
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email Address
              </span>
              <div className="text-[#FFFFFF] mt-0.5 flex items-center gap-1.5">
                {user.email}
                <Lock className="w-3 h-3 text-[#A1A1AA]/50" />
              </div>
            </div>

            {/* Role — READ-ONLY */}
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase">Permission Role</span>
              <div className="text-[#F97316] font-mono font-bold mt-0.5 flex items-center gap-1.5">
                <Shield className="w-4 h-4 shrink-0" />
                <span>{user.role}</span>
              </div>
            </div>

            <p className="text-[10px] text-[#A1A1AA]/70 flex items-center gap-1.5 pt-1">
              <Lock className="w-3 h-3 shrink-0" />
              <span>Username, email, and role are managed by an administrator.</span>
            </p>

          </div>
        )}

        {/* Action buttons */}
        {!isEditing && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-[#27272A]">
            <button
              onClick={startEditing}
              className="flex-1 py-2 border border-[#27272A] hover:bg-[#27272A]/30 text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Name</span>
            </button>
            <button
              onClick={openPasswordModal}
              className="flex-1 py-2 bg-[#F97316] hover:bg-[#EA580C] text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Change Password Modal */}
      <FormModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        icon={<KeyRound className="w-5 h-5" />}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordErrors.form}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-white outline-none transition-all ${
                passwordErrors.currentPassword ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {passwordErrors.currentPassword && (
              <p className="text-[10px] text-[#EF4444] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordErrors.currentPassword}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-white outline-none transition-all ${
                passwordErrors.newPassword ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {passwordErrors.newPassword && (
              <p className="text-[10px] text-[#EF4444] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordErrors.newPassword}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-white outline-none transition-all ${
                passwordErrors.confirmPassword ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {passwordErrors.confirmPassword && (
              <p className="text-[10px] text-[#EF4444] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordErrors.confirmPassword}</span>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#27272A]">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="flex-1 py-2.5 border border-[#27272A] hover:bg-[#18181B] text-xs font-semibold text-[#A1A1AA] hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex-1 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-xs font-semibold text-white rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
            </button>
          </div>
        </form>
      </FormModal>

    </div>
  );
};

export default Profile;