import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  AlertTriangle,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FormModal from "../layouts/common/FormModal";
import ConfirmationModal from "../layouts/common/ConfirmationModal";
import ScheduleTable from "../layouts/tables/ScheduleTable";


const Schedules = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Core registries
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]); // Active-only routes (for new/normal selection)
  const [allRoutes, setAllRoutes] = useState([]); // Unfiltered, used to resolve locked/inactive routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('scheduleCode');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Form input state
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({
    route: '',
    departureTime: '06:00',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Admin override form state
  const [overrideFormData, setOverrideFormData] = useState({
    route: '',
    departureTime: '06:00',
    status: 'Active',
    reason: ''
  });
  const [overrideErrors, setOverrideErrors] = useState({});

  // Terminal Personnel review (accept/dispute) state
  const [disputeMode, setDisputeMode] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [reviewError, setReviewError] = useState(null);

  // Fetch schedules & routes
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedulesRes, routesRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/routes')
      ]);

      if (schedulesRes.data.success) {
        setSchedules(schedulesRes.data.data);
      }
      if (routesRes.data.success) {
        const allFetchedRoutes = routesRes.data.data;
        setAllRoutes(allFetchedRoutes);

        // Only allow active routes to be scheduled/newly selected
        const activeOnly = allFetchedRoutes.filter((r) => r.status === 'Active' || !r.status);
        setRoutes(activeOnly);
        if (activeOnly.length > 0) {
          setFormData((prev) => ({ ...prev, route: activeOnly[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching schedules/routes:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to transit services.');
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  const loadData = async () => {
    await fetchData();
  };

  loadData();
}, []);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };


  const getRouteOptions = (currentRouteId) => {
    const isCurrentActive = routes.some((r) => r._id === currentRouteId);
    if (!currentRouteId || isCurrentActive) return routes;

    const inactiveRoute = allRoutes.find((r) => r._id === currentRouteId);
    return inactiveRoute ? [...routes, inactiveRoute] : routes;
  };

  // Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.route) {
      errors.route = 'An active travel route is required.';
    }

    if (!formData.departureTime) {
      errors.departureTime = 'Departure time is required.';
    } else {
      const timeMatch = formData.departureTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
      if (!timeMatch) {
        errors.departureTime = 'Departure time must be in HH:MM format.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add Schedule Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const response = await api.post('/schedules', formData);
      if (response.data.success) {
        triggerSuccess(`Schedule ${response.data.data.scheduleCode} registered successfully!`);
        setIsAddOpen(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      const serverMsg = err.response?.data?.message || 'Failed to register schedule slot.';
      if (serverMsg.toLowerCase().includes('duplicate') || serverMsg.toLowerCase().includes('already exists')) {
        setFormErrors({ form: 'A schedule slot already exists for this travel corridor at the specified departure time.' });
      } else {
        setFormErrors({ form: serverMsg });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Edit Schedule Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const response = await api.put(`/schedules/${selectedSchedule._id}`, formData);
      if (response.data.success) {
        triggerSuccess(`Schedule ${response.data.data.scheduleCode} details updated successfully!`);
        setIsEditOpen(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      const serverMsg = err.response?.data?.message || 'Failed to update schedule slot.';
      if (serverMsg.toLowerCase().includes('duplicate') || serverMsg.toLowerCase().includes('already exists')) {
        setFormErrors({ form: 'A schedule slot already exists for this travel corridor at the specified departure time.' });
      } else {
        setFormErrors({ form: serverMsg });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedSchedule) return;
    setSubmitLoading(true);
    try {
      const response = await api.delete(`/schedules/${selectedSchedule._id}`);
      if (response.data.success) {
        triggerSuccess(`Schedule slot ${selectedSchedule.scheduleCode} deleted successfully.`);
        setIsDeleteOpen(false);
        setSelectedSchedule(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      triggerSuccess(`Error: ${err.response?.data?.message || 'Could not delete schedule slot.'}`);
      setIsDeleteOpen(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Admin Override inputs
  const handleOverrideInputChange = (e) => {
    const { name, value } = e.target;
    setOverrideFormData((prev) => ({ ...prev, [name]: value }));

    if (overrideErrors[name]) {
      setOverrideErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateOverrideForm = () => {
    const errors = {};

    if (!overrideFormData.route) {
      errors.route = 'An active travel route is required.';
    }

    if (!overrideFormData.departureTime) {
      errors.departureTime = 'Departure time is required.';
    } else {
      const timeMatch = overrideFormData.departureTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
      if (!timeMatch) {
        errors.departureTime = 'Departure time must be in HH:MM format.';
      }
    }

    if (!overrideFormData.reason || !overrideFormData.reason.trim()) {
      errors.reason = 'You must explain why this correction is being made.';
    }

    setOverrideErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Admin Override Submit
  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!validateOverrideForm()) return;

    setSubmitLoading(true);
    try {
      const response = await api.patch(`/schedules/${selectedSchedule._id}/override`, overrideFormData);
      if (response.data.success) {
        triggerSuccess(`Schedule ${response.data.data.scheduleCode} corrected via admin override.`);
        setIsOverrideOpen(false);
        setSelectedSchedule(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error applying override:', err);
      setOverrideErrors({ form: err.response?.data?.message || 'Failed to apply override.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Terminal Personnel: Accept override
  const handleAcknowledgeOverride = async () => {
    if (!selectedSchedule) return;
    setSubmitLoading(true);
    try {
      const response = await api.patch(`/schedules/${selectedSchedule._id}/acknowledge-override`);
      if (response.data.success) {
        triggerSuccess(`Override on ${selectedSchedule.scheduleCode} acknowledged.`);
        setIsReviewOpen(false);
        setSelectedSchedule(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error acknowledging override:', err);
      setReviewError(err.response?.data?.message || 'Could not acknowledge override.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Terminal Personnel: Dispute override
  const handleDisputeOverride = async () => {
    if (!selectedSchedule) return;

    if (!disputeReason.trim()) {
      setReviewError('Please explain why you are disputing this correction.');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await api.patch(`/schedules/${selectedSchedule._id}/dispute-override`, { disputeReason });
      if (response.data.success) {
        triggerSuccess(`Dispute submitted for ${selectedSchedule.scheduleCode}. Admin has been flagged.`);
        setIsReviewOpen(false);
        setSelectedSchedule(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error submitting dispute:', err);
      setReviewError(err.response?.data?.message || 'Could not submit dispute.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEditModal = (sched) => {
    setSelectedSchedule(sched);
    setFormData({
      route: sched.route ? sched.route._id : '',
      departureTime: sched.departureTime,
      status: sched.status || 'Active'
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const openDeleteModal = (sched) => {
    setSelectedSchedule(sched);
    setIsDeleteOpen(true);
  };

  const openOverrideModal = (sched) => {
    setSelectedSchedule(sched);
    setOverrideFormData({
      route: sched.route ? sched.route._id : '',
      departureTime: sched.departureTime,
      status: sched.status || 'Active',
      reason: ''
    });
    setOverrideErrors({});
    setIsOverrideOpen(true);
  };

  const openReviewModal = (sched) => {
    setSelectedSchedule(sched);
    setDisputeMode(false);
    setDisputeReason('');
    setReviewError(null);
    setIsReviewOpen(true);
  };

  const resetForm = () => {
    setFormData({
      route: routes.length > 0 ? routes[0]._id : '',
      departureTime: '06:00',
      status: 'Active'
    });
    setFormErrors({});
    setSelectedSchedule(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Stats calculation
  const totalSchedules = schedules.length;
  const activeSchedules = schedules.filter((s) => s.status === 'Active' || !s.status).length;
  const inactiveSchedules = schedules.filter((s) => s.status === 'Inactive').length;

  // Filter & Search & Sort routing data
const filteredSchedules = schedules
  .filter((sched) => {
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      query === "" ||
      sched.scheduleCode?.toLowerCase().includes(query) ||
      sched.departureTime?.includes(query) ||
      sched.expectedArrivalTime?.includes(query) ||
      sched.route?.routeCode?.toLowerCase().includes(query) ||
      sched.route?.origin?.toLowerCase().includes(query) ||
      sched.route?.destination?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" ||
      sched.status === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .sort((a, b) => {
    let valA;
    let valB;

    switch (sortBy) {
      case "route":
        valA = `${a.route?.origin || ""}${a.route?.destination || ""}`;
        valB = `${b.route?.origin || ""}${b.route?.destination || ""}`;
        break;

      case "expectedArrivalTime":
        valA = a.expectedArrivalTime || "";
        valB = b.expectedArrivalTime || "";
        break;

      default:
        valA = a[sortBy] || "";
        valB = b[sortBy] || "";
    }

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;

    return 0;
  });

   

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] p-4 rounded-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-32 h-32 rounded-full bg-[#F97316]/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2.5 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20">
            <Clock className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Departure Schedule Manager</h3>
            <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
              {isAdmin ? 'View operations. Correct errors when needed.' : 'Plan Routes. Manage Trips. Monitor Operations.'}
            </p>
          </div>
        </div>
        {!isAdmin && (
          <button
            onClick={openAddModal}
            disabled={routes.length === 0}
            className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-[#FFFFFF] rounded-lg shadow-md shadow-[#F97316]/10 hover:shadow-lg hover:shadow-[#F97316]/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule Slot</span>
          </button>
        )}
      </div>

      {/* Success alert banner */}
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

      {routes.length === 0 && !loading && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <strong>System Pre-requisite Required:</strong> No active corridors routes are registered. You must first create at least one active route under Route Management before configuring trip departures.
          </div>
        </div>
      )}

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Schedules */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Total Schedules</span>
            <div className="p-1 rounded bg-[#F97316]/5 border border-[#F97316]/10 text-[#F97316]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#FFFFFF] font-mono">{loading ? '...' : totalSchedules}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Registered departure slots</span>
          </div>
        </div>

        {/* Active Schedules */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Active Schedules</span>
            <div className="p-1 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-emerald-400 font-mono">{loading ? '...' : activeSchedules}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Approved operating slots</span>
          </div>
        </div>

        {/* Inactive Schedules */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Inactive Schedules</span>
            <div className="p-1 rounded bg-[#EF4444]/5 border border-[#EF4444]/10 text-[#EF4444]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#EF4444] font-mono">{loading ? '...' : inactiveSchedules}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Excluded from current schedule</span>
          </div>
        </div>
      </div>

      {/* Network or database connection error */}
      {error && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#EF4444] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <strong>System Connection Error:</strong> {error}
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-[#EF4444]/20 text-[#EF4444] font-mono text-[10px] hover:bg-[#EF4444]/30 rounded transition-colors uppercase font-bold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Control Board */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-[#27272A] flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by Sched Code, departure time, origin, dest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FFFFFF] placeholder:text-[#A1A1AA]/40 outline-none focus:border-[#F97316]/50 transition-all font-sans"
            />
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 rounded-lg text-xs text-[#FFFFFF]">
              <span className="text-[10px] font-mono text-[#A1A1AA] uppercase mr-1">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-[#FFFFFF] text-xs font-semibold cursor-pointer select-none"
              >
                <option value="All" className="bg-[#18181B] text-[#FFFFFF]">All Statuses</option>
                <option value="Active" className="bg-[#18181B] text-emerald-400 font-semibold">Active</option>
                <option value="Inactive" className="bg-[#18181B] text-[#EF4444] font-semibold">Inactive</option>
              </select>
            </div>

            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
                className="px-3 py-2 border border-[#27272A] hover:bg-[#27272A]/30 text-[#A1A1AA] hover:text-[#FFFFFF] rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* List Table Loader */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full"
            />
            <span className="text-xs font-mono text-[#A1A1AA]">Retrieving Scheduling Slots...</span>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-[#27272A]/20 border border-[#27272A] text-[#A1A1AA]">
              <Clock className="w-8 h-8 text-[#A1A1AA]/50" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-sm font-semibold text-[#FFFFFF]">No Schedules Registered</h4>
              <p className="text-xs text-[#A1A1AA] mt-1.5">
                No trip schedules match your filters. Establish a new departure timing on an active corridor route.
              </p>
            </div>
            {routes.length > 0 && !isAdmin && (
              <button
                onClick={openAddModal}
                className="px-3 py-1.5 bg-[#F97316]/10 border border-[#F97316]/20 hover:bg-[#F97316]/20 text-[#F97316] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Configure Schedule
              </button>
            )}
          </div>
        ) : (
          <ScheduleTable
  schedules={filteredSchedules}
  onEdit={openEditModal}
  onDelete={openDeleteModal}
  onOverride={openOverrideModal}
  onReviewOverride={openReviewModal}
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSort={handleSort}
  isAdmin={isAdmin}
/>
        )}
      </div>

      {/* --- MODALS DIALOGS --- */}

      {/* Add Schedule Form Modal */}
      <FormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Schedule Departure Slot"
        icon={<Clock className="w-5 h-5" />}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 leading-normal font-sans">{formErrors.form}</span>
            </div>
          )}

          {/* Route Dropdown Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Assigned Corridor Route</label>
            <select
              name="route"
              value={formData.route}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer ${
                formErrors.route ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              {getRouteOptions(formData.route).map((rt) => (
                <option key={rt._id} value={rt._id} disabled={rt.status === 'Inactive'}>
                  {rt.routeCode}: {rt.origin} to {rt.destination} (₱{rt.estimatedFare})
                  {rt.status === 'Inactive' ? ' — Inactive (Locked)' : ''}
                </option>
              ))}
            </select>
            {formErrors.route && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.route}</span>
              </p>
            )}
          </div>

          {/* Departure Time Input (HH:MM string) */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Departure Time (24-Hour Format)</label>
            <input
              type="time"
              name="departureTime"
              value={formData.departureTime}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all cursor-pointer ${
                formErrors.departureTime ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.departureTime ? (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.departureTime}</span>
              </p>
            ) : (
              <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Specify departure hour using local 24-hour clock. Expected arrival is calculated dynamically.</span>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Operational Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Register Schedule</span>
              )}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Edit Schedule Form Modal */}
      <FormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={selectedSchedule ? `Modify Schedule: ${selectedSchedule.scheduleCode}` : 'Modify Schedule'}
        icon={<Clock className="w-5 h-5 text-blue-500" />}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 leading-normal font-sans">{formErrors.form}</span>
            </div>
          )}

          {/* Route Dropdown Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Assigned Corridor Route</label>
            <select
              name="route"
              value={formData.route}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer ${
                formErrors.route ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              {getRouteOptions(formData.route).map((rt) => (
                <option key={rt._id} value={rt._id} disabled={rt.status === 'Inactive'}>
                  {rt.routeCode}: {rt.origin} to {rt.destination} (₱{rt.estimatedFare})
                  {rt.status === 'Inactive' ? ' — Inactive (Locked)' : ''}
                </option>
              ))}
            </select>
            {formErrors.route && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.route}</span>
              </p>
            )}
            {getRouteOptions(formData.route).some((rt) => rt._id === formData.route && rt.status === 'Inactive') && (
              <p className="text-[9px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>This route has since become Inactive. It's locked here for reference — reassign to an active route if needed.</span>
              </p>
            )}
          </div>

          {/* Departure Time Input (HH:MM string) */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Departure Time (24-Hour Format)</label>
            <input
              type="time"
              name="departureTime"
              value={formData.departureTime}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all cursor-pointer ${
                formErrors.departureTime ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.departureTime && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.departureTime}</span>
              </p>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Operational Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
                <span>Update Schedule</span>
              )}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Admin Override Form Modal */}
      <FormModal
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        title={selectedSchedule ? `Admin Override: ${selectedSchedule.scheduleCode}` : 'Admin Override'}
        icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-400 leading-relaxed font-sans">
            You're correcting an entry originally made by Terminal Personnel. This action is logged distinctly from a normal edit, and Terminal Personnel will be notified to review your correction.
          </div>

          {selectedSchedule?.overrideDisputeReason && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-sans">
              <strong className="block mb-1">Terminal Personnel disputed the previous override:</strong>
              <span className="leading-relaxed">{selectedSchedule.overrideDisputeReason}</span>
            </div>
          )}

          {overrideErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 leading-normal font-sans">{overrideErrors.form}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Assigned Corridor Route</label>
            <select
              name="route"
              value={overrideFormData.route}
              onChange={handleOverrideInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-amber-500/50 transition-all cursor-pointer ${
                overrideErrors.route ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              {getRouteOptions(overrideFormData.route).map((rt) => (
                <option key={rt._id} value={rt._id} disabled={rt.status === 'Inactive'}>
                  {rt.routeCode}: {rt.origin} to {rt.destination} (₱{rt.estimatedFare})
                  {rt.status === 'Inactive' ? ' — Inactive (Locked)' : ''}
                </option>
              ))}
            </select>
            {overrideErrors.route && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{overrideErrors.route}</span>
              </p>
            )}
            {getRouteOptions(overrideFormData.route).some((rt) => rt._id === overrideFormData.route && rt.status === 'Inactive') && (
              <p className="text-[9px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>This route has since become Inactive. It's locked here for reference — reassign to an active route if needed.</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Departure Time (24-Hour Format)</label>
            <input
              type="time"
              name="departureTime"
              value={overrideFormData.departureTime}
              onChange={handleOverrideInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all cursor-pointer ${
                overrideErrors.departureTime ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-amber-500/50'
              }`}
            />
            {overrideErrors.departureTime && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{overrideErrors.departureTime}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Operational Status</label>
            <select
              name="status"
              value={overrideFormData.status}
              onChange={handleOverrideInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-amber-500/50 transition-all cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Reason for Correction (Required)</label>
            <textarea
              name="reason"
              value={overrideFormData.reason}
              onChange={handleOverrideInputChange}
              rows={3}
              placeholder="e.g. Departure time was mistakenly entered as 08:00 instead of 06:00, confirmed with Terminal Personnel via phone."
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 resize-none ${
                overrideErrors.reason ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-amber-500/50'
              }`}
            />
            {overrideErrors.reason && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{overrideErrors.reason}</span>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#27272A]">
            <button
              type="button"
              onClick={() => setIsOverrideOpen(false)}
              className="flex-1 py-2.5 border border-[#27272A] hover:bg-[#18181B] text-xs font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-xs font-semibold text-[#09090B] rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Apply Correction</span>
              )}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Override Review Modal — Terminal Personnel accepts/disputes, or Admin views a dispute */}
      <FormModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={selectedSchedule ? `Review Correction: ${selectedSchedule.scheduleCode}` : 'Review Correction'}
        icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}
      >
        <div className="space-y-4">
          {reviewError && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 leading-normal font-sans">{reviewError}</span>
            </div>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 font-sans">
            <strong className="block mb-1">Admin's reason for correction:</strong>
            <span className="leading-relaxed">{selectedSchedule?.overrideReason || '--'}</span>
            {selectedSchedule?.lastOverriddenBy && (
              <div className="mt-2 text-[10px] text-[#A1A1AA]">
                — {selectedSchedule.lastOverriddenBy.fullName || selectedSchedule.lastOverriddenBy.username}
              </div>
            )}
          </div>

          {isAdmin ? (
            selectedSchedule?.overrideDisputeReason ? (
              <>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-sans">
                  <strong className="block mb-1">Terminal Personnel's dispute:</strong>
                  <span className="leading-relaxed">{selectedSchedule.overrideDisputeReason}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsReviewOpen(false); openOverrideModal(selectedSchedule); }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-xs font-semibold text-[#09090B] rounded-lg shadow-md transition-all cursor-pointer"
                >
                  Submit Revised Correction
                </button>
              </>
            ) : (
              <p className="text-xs text-[#A1A1AA] font-sans">Waiting for Terminal Personnel to review this correction. No action needed from you right now.</p>
            )
          ) : (
            <>
              {!disputeMode ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAcknowledgeOverride}
                    disabled={submitLoading}
                    className="flex-1 py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Accept Correction</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisputeMode(true)}
                    className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold text-red-400 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>Dispute</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Reason for Dispute</label>
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. The original entry was actually correct — please re-verify with me before overriding."
                      className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-red-500/50 transition-all placeholder:text-[#A1A1AA]/30 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setDisputeMode(false); setDisputeReason(''); setReviewError(null); }}
                      className="flex-1 py-2.5 border border-[#27272A] hover:bg-[#18181B] text-xs font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleDisputeOverride}
                      disabled={submitLoading}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-xs font-semibold text-white rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Submit Dispute</span>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Schedule Slot?"
        message={selectedSchedule ? `This will permanently delete schedule slot ${selectedSchedule.scheduleCode} (${selectedSchedule.route ? selectedSchedule.route.origin + ' - ' + selectedSchedule.route.destination : 'Unknown'} at ${selectedSchedule.departureTime}) from the system records. Trips scheduled under this slot will become un-assigned. Continue?` : ''}
        confirmText="Yes, delete schedule"
        cancelText="Cancel"
        type="danger"
        isLoading={submitLoading}
      />
    </div>
  );
};

export default Schedules;