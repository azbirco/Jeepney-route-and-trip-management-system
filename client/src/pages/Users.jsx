import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../services/api';
import FormModal from '../layouts/common/FormModal';
import ConfirmationModal from '../layouts/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';

// Used for the filter dropdown — includes Admin so existing Admin
// accounts can still be searched/filtered in the table.
const ROLES = ['Admin', 'Terminal Personnel', 'Driver'];

// Used for Create/Edit forms — Admin excluded on purpose. There is
// only ever one Admin account in this system; creating additional
// Admin accounts is intentionally kept out of this UI.
const ASSIGNABLE_ROLES = ['Terminal Personnel', 'Driver'];

const Users = () => {
  const { user: currentUser } = useAuth();

  // Guard: only Admin can access this page, even if someone
  // types the /users URL directly without going through the sidebar
  if (currentUser?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Core state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal open states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'Terminal Personnel',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to retrieve user accounts.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to account services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers();
    };
    loadUsers();
  }, []);

  // Success Notification
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validation
  const validateForm = (isEdit = false) => {
    const errors = {};

    if (!formData.username || formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'A valid email address is required.';
    }

    if (!formData.fullName || formData.fullName.trim() === '') {
      errors.fullName = 'Full name is required.';
    }

    // Password required on create; optional on edit (leave blank to keep current)
    if (!isEdit) {
      if (!formData.password || formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'New password must be at least 6 characters.';
    }

    // Guard: role must be one of the assignable roles (Admin excluded),
    // even if formData.role were somehow tampered with before submit.
    if (!formData.role || !ASSIGNABLE_ROLES.includes(formData.role)) {
      errors.role = 'A valid role must be selected.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create User
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setSubmitLoading(true);
    try {
      const response = await api.post('/users', formData);
      if (response.data.success) {
        triggerSuccess(`Account ${response.data.data.username} (${response.data.data.role}) created successfully!`);
        setIsAddOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setFormErrors({ form: err.response?.data?.message || 'Failed to create user account.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Edit User
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setSubmitLoading(true);
    try {
      // Don't send an empty password field — backend keeps existing password if omitted
      const payload = { ...formData };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }

      const response = await api.put(`/users/${selectedUser._id}`, payload);
      if (response.data.success) {
        triggerSuccess(`Account ${response.data.data.username} updated successfully!`);
        setIsEditOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setFormErrors({ form: err.response?.data?.message || 'Failed to update user account.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete User
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setSubmitLoading(true);
    try {
      const response = await api.delete(`/users/${selectedUser._id}`);
      if (response.data.success) {
        triggerSuccess(`Account ${selectedUser.username} was deleted successfully.`);
        setIsDeleteOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      triggerSuccess(`Error: ${err.response?.data?.message || 'Could not delete user account.'}`);
      setIsDeleteOpen(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handlers to open modals
  const openAddModal = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEditModal = (user) => {
    // Guard: prevent opening the edit modal for an Admin account through
    // this UI, since Admin isn't one of the assignable/editable roles here.
    if (user.role === 'Admin') {
      triggerSuccess('The Admin account cannot be modified through this screen.');
      return;
    }

    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setFormErrors({});
    setShowPassword(false);
    setIsEditOpen(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'Terminal Personnel',
      isActive: true
    });
    setFormErrors({});
    setSelectedUser(null);
    setShowPassword(false);
  };

  // Sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Stats calculation
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'Admin').length;
  const terminalCount = users.filter((u) => u.role === 'Terminal Personnel').length;
  const driverCount = users.filter((u) => u.role === 'Driver').length;

  // Filter & Search & Sort
  const filteredUsers = users
    .filter((u) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        (u.username && u.username.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.fullName && u.fullName.toLowerCase().includes(query));

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const getRoleStyle = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Terminal Personnel':
        return 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20';
      case 'Driver':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'Driver':
        return <Truck className="w-3.5 h-3.5" />;
      default:
        return <UserCheck className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] p-4 rounded-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-32 h-32 rounded-full bg-[#F97316]/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2.5 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20">
            <UserCog className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#FFFFFF]">User Account Management</h3>
            <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Create and manage Terminal Personnel and Driver accounts.</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-[#FFFFFF] rounded-lg shadow-md shadow-[#F97316]/10 hover:shadow-lg hover:shadow-[#F97316]/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3 shadow-md backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div className="flex-1 font-sans">{successMsg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Total Accounts</span>
            <div className="p-1 rounded bg-[#F97316]/5 border border-[#F97316]/10 text-[#F97316]">
              <UserCog className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#FFFFFF] font-mono">{loading ? '...' : totalUsers}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Registered system users</span>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Admins</span>
            <div className="p-1 rounded bg-sky-500/5 border border-sky-500/10 text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-sky-400 font-mono">{loading ? '...' : adminCount}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Full system oversight</span>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Terminal Personnel</span>
            <div className="p-1 rounded bg-[#F97316]/5 border border-[#F97316]/10 text-[#F97316]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#F97316] font-mono">{loading ? '...' : terminalCount}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Manage daily operations</span>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Drivers</span>
            <div className="p-1 rounded bg-violet-500/5 border border-violet-500/10 text-violet-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-violet-400 font-mono">{loading ? '...' : driverCount}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Report trip arrivals</span>
          </div>
        </div>
      </div>

      {/* Connection error */}
      {error && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#EF4444] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <strong>System Connection Error:</strong> {error}
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 bg-[#EF4444]/20 text-[#EF4444] font-mono text-[10px] hover:bg-[#EF4444]/30 rounded transition-colors uppercase font-bold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Control Board */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-[#27272A] flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by username, email, or full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FFFFFF] placeholder:text-[#A1A1AA]/40 outline-none focus:border-[#F97316]/50 transition-all font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 rounded-lg text-xs text-[#FFFFFF]">
              <span className="text-[10px] font-mono text-[#A1A1AA] uppercase mr-1">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-[#FFFFFF] text-xs font-semibold cursor-pointer select-none"
              >
                <option value="All" className="bg-[#18181B] text-[#FFFFFF]">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#18181B] text-[#FFFFFF]">{r}</option>
                ))}
              </select>
            </div>

            {(searchQuery || roleFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('All');
                }}
                className="px-3 py-2 border border-[#27272A] hover:bg-[#27272A]/30 text-[#A1A1AA] hover:text-[#FFFFFF] rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full"
            />
            <span className="text-xs font-mono text-[#A1A1AA]">Retrieving Account Registry...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-[#27272A]/20 border border-[#27272A] text-[#A1A1AA]">
              <UserCog className="w-8 h-8 text-[#A1A1AA]/50" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-sm font-semibold text-[#FFFFFF]">No Accounts Found</h4>
              <p className="text-xs text-[#A1A1AA] mt-1.5">
                No user accounts match your filters. Create a new account to get started.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-3 py-1.5 bg-[#F97316]/10 border border-[#F97316]/20 hover:bg-[#F97316]/20 text-[#F97316] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#09090B] border-b border-[#27272A]">
                <tr className="text-[11px] font-mono text-[#A1A1AA] tracking-wider uppercase select-none">
                  <th className="px-5 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => handleSort('username')}>
                    Username
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => handleSort('fullName')}>
                    Full Name
                  </th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => handleSort('role')}>
                    Role
                  </th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => {
                  const isAdminRow = item.role === 'Admin';

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-[#27272A] hover:bg-[#18181B] transition-colors text-xs text-[#FFFFFF] group"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-[#FFFFFF]">
                        {item.username}
                        {item._id === currentUser?._id && (
                          <span className="ml-2 text-[9px] text-[#A1A1AA] font-normal">(You)</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-[#FFFFFF]">
                        {item.fullName}
                      </td>

                      <td className="px-5 py-4 text-[#A1A1AA] font-mono">
                        {item.email}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${getRoleStyle(item.role)}`}>
                          {getRoleIcon(item.role)}
                          {item.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                          item.isActive
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-400' : 'bg-[#EF4444]'}`} />
                          {item.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            disabled={isAdminRow}
                            title={isAdminRow ? 'The Admin account cannot be modified here' : 'Edit Account'}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                              isAdminRow
                                ? 'opacity-35 cursor-not-allowed border-[#27272A] text-[#A1A1AA]'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 cursor-pointer'
                            }`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            disabled={item._id === currentUser?._id || isAdminRow}
                            title={
                              item._id === currentUser?._id
                                ? 'Cannot delete your own account'
                                : isAdminRow
                                ? 'The Admin account cannot be deleted'
                                : 'Delete Account'
                            }
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                              item._id === currentUser?._id || isAdminRow
                                ? 'opacity-35 cursor-not-allowed border-[#27272A] text-[#A1A1AA]'
                                : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODALS DIALOGS --- */}

      {/* Add User Form Modal */}
      <FormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create User Account"
        icon={<UserCog className="w-5 h-5" />}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.form}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="e.g. Juan Dela Cruz"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                formErrors.fullName ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.fullName && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.fullName}</span>
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="e.g. jdelacruz"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                formErrors.username ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.username ? (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.username}</span>
              </p>
            ) : (
              <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">At least 3 characters, used to log in</span>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g. jdelacruz@terminal.ph"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                formErrors.email ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.email && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.email}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 6 characters"
                className={`w-full px-3.5 py-2.5 pr-10 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                  formErrors.password ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.password}</span>
              </p>
            )}
          </div>

          {/* Role Selection — Admin excluded, only 2 buttons now */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ASSIGNABLE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: r })}
                  className={`py-2.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    formData.role === r
                      ? 'bg-[#F97316]/10 border-[#F97316] text-[#F97316]'
                      : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#27272A]/80'
                  }`}
                >
                  {getRoleIcon(r)}
                  <span className="font-sans text-center leading-tight">{r}</span>
                </button>
              ))}
            </div>
            {formErrors.role && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.role}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#27272A]">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 py-2.5 border border-[#27272A] hover:bg-[#18181B] text-xs font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-xs font-semibold text-[#FFFFFF] rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Edit User Form Modal */}
      <FormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={selectedUser ? `Modify Account: ${selectedUser.username}` : 'Modify Account'}
        icon={<Edit className="w-5 h-5 text-blue-500" />}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.form}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.fullName ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.fullName && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.fullName}</span>
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.username ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.username && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.username}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.email ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.email && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.email}</span>
              </p>
            )}
          </div>

          {/* Password (optional on edit) */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
                className={`w-full px-3.5 py-2.5 pr-10 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                  formErrors.password ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formErrors.password ? (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.password}</span>
              </p>
            ) : (
              <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Only fill this in if you want to reset the password</span>
            )}
          </div>

          {/* Role Selection — Admin excluded, only 2 buttons now */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ASSIGNABLE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: r })}
                  className={`py-2.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    formData.role === r
                      ? 'bg-[#F97316]/10 border-[#F97316] text-[#F97316]'
                      : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#27272A]/80'
                  }`}
                >
                  {getRoleIcon(r)}
                  <span className="font-sans text-center leading-tight">{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Account Status</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`w-full py-2.5 px-3.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between ${
                formData.isActive
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'
              }`}
            >
              <span>{formData.isActive ? 'Active — account can log in' : 'Deactivated — account is locked out'}</span>
              <span className={`w-8 h-4 rounded-full relative transition-colors ${formData.isActive ? 'bg-emerald-400' : 'bg-[#EF4444]'}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-[#09090B] transition-all ${formData.isActive ? 'left-4' : 'left-0.5'}`} />
              </span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#27272A]">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 py-2.5 border border-[#27272A] hover:bg-[#18181B] text-xs font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-xs font-semibold text-[#FFFFFF] rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Update Account</span>
              )}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Account?"
        message={selectedUser ? `This will permanently delete the account for ${selectedUser.fullName} (${selectedUser.username}, ${selectedUser.role}). This action cannot be undone.` : ''}
        confirmText="Yes, delete account"
        cancelText="Cancel"
        type="danger"
        isLoading={submitLoading}
      />
    </div>
  );
};

export default Users;