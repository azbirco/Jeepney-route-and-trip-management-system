import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Bus,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Navigation,
  RefreshCw,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Default seating capacity suggested per type. Real-world plate-to-plate
// capacity still varies by owner modification, so this only pre-fills the
// field — Admin can always override it before saving.
const getDefaultCapacity = (type) => (type === 'E-Jeep' ? 23 : 18);

const Jeepneys = () => {
  const { user } = useAuth();
  // Only Admin manages the fleet registry — plate numbers, unit types, and
  // seating capacity are setup/master data, not day-to-day operational
  // decisions. Terminal Personnel get a read-only view (they use existing
  // units when building schedules/trips), and Driver has no business
  // creating/editing/deleting units — they only drive them.
  const canManageJeepneys = user?.role === 'Admin';

  // State variables
  const [jeepneys, setJeepneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('jeepneyNumber');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active document states
  const [selectedJeepney, setSelectedJeepney] = useState(null);
  const [formData, setFormData] = useState({
    plateNumber: '',
    type: 'Traditional Jeepney',
    capacity: getDefaultCapacity('Traditional Jeepney'),
    status: 'Available'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Raw fetch: talks to the API only, never touches component state.
  // Keeping this state-free means it's safe to call from anywhere
  // (effects, handlers) without risking a stray setState call.
  const loadJeepneysData = useCallback(async () => {
    const response = await api.get('/jeepneys');
    return response.data.data || [];
  }, []);

  // Reusable, state-updating fetch — used after add/edit/delete and by the
  // "Retry Connection" button. These are triggered from event handlers, not
  // an effect, so updating state directly here is safe.
  const fetchJeepneys = useCallback(async () => {
    try {
      const data = await loadJeepneysData();
      setJeepneys(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jeepneys');
    } finally {
      setLoading(false);
    }
  }, [loadJeepneysData]);

  // Initial load on mount. Follows React's recommended data-fetching-in-effects
  // pattern: an `ignore` flag guards every state update so nothing is set
  // after the component unmounts or this effect re-runs, and every setState
  // call happens inside the async continuation (after `await`), never
  // synchronously inside the effect body itself.
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const data = await loadJeepneysData();
        if (!ignore) {
          setJeepneys(data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Failed to load jeepneys');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [loadJeepneysData]);

  // Show temporary success alert
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  // Form input change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? (value === '' ? '' : parseInt(value, 10)) : value
    }));
    // Clear validation error when typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Type selection handler — switches type AND pre-fills the suggested
  // capacity for that type. Still fully editable afterward.
  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      capacity: getDefaultCapacity(type)
    }));
    if (formErrors.capacity) {
      setFormErrors((prev) => ({ ...prev, capacity: null }));
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    const plateRegex = /^[A-Z]{2,3}-\d{4,5}$/i;

    if (!formData.plateNumber || formData.plateNumber.trim() === '') {
      errors.plateNumber = 'Plate Number is required.';
    } else if (!plateRegex.test(formData.plateNumber.trim())) {
      errors.plateNumber = 'Format must be like AAA-1234 or AA-12345.';
    }

    if (formData.capacity === undefined || formData.capacity === '') {
      errors.capacity = 'Capacity is required.';
    } else if (isNaN(formData.capacity) || formData.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than zero.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Create Jeepney Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const formattedData = {
        ...formData,
        plateNumber: formData.plateNumber.trim().toUpperCase()
      };
      const response = await api.post('/jeepneys', formattedData);
      if (response.data.success) {
        triggerSuccess(`Jeepney ${response.data.data.jeepneyNumber} created successfully!`);
        setIsAddOpen(false);
        resetForm();
        fetchJeepneys();
      }
    } catch (err) {
      console.error('Error creating jeepney:', err);
      const serverMsg = err.response?.data?.message || 'Failed to save jeepney.';
      if (serverMsg.toLowerCase().includes('plate')) {
        setFormErrors({ plateNumber: 'This Plate Number is already registered.' });
      } else {
        setFormErrors({ form: serverMsg });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Edit Jeepney Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const formattedData = {
        ...formData,
        plateNumber: formData.plateNumber.trim().toUpperCase()
      };
      const response = await api.put(`/jeepneys/${selectedJeepney._id}`, formattedData);
      if (response.data.success) {
        triggerSuccess(`Jeepney ${response.data.data.jeepneyNumber} details updated successfully!`);
        setIsEditOpen(false);
        resetForm();
        fetchJeepneys();
      }
    } catch (err) {
      console.error('Error updating jeepney:', err);
      const serverMsg = err.response?.data?.message || 'Failed to update jeepney details.';
      if (serverMsg.toLowerCase().includes('plate')) {
        setFormErrors({ plateNumber: 'This Plate Number is already registered.' });
      } else {
        setFormErrors({ form: serverMsg });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Delete Jeepney
  const handleDeleteConfirm = async () => {
    if (!selectedJeepney) return;
    setSubmitLoading(true);
    try {
      const response = await api.delete(`/jeepneys/${selectedJeepney._id}`);
      if (response.data.success) {
        triggerSuccess(`Jeepney ${selectedJeepney.jeepneyNumber} deleted successfully.`);
        setIsDeleteOpen(false);
        setSelectedJeepney(null);
        fetchJeepneys();
      }
    } catch (err) {
      console.error('Error deleting jeepney:', err);
      triggerSuccess(`Error: ${err.response?.data?.message || 'Could not delete unit.'}`);
      setIsDeleteOpen(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open Edit Modal with selected Jeepney info
  const openEditModal = (jeepney) => {
    setSelectedJeepney(jeepney);
    setFormData({
      plateNumber: jeepney.plateNumber,
      type: jeepney.type,
      capacity: jeepney.capacity,
      status: jeepney.status
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  // Open View Details Modal
  const openViewModal = (jeepney) => {
    setSelectedJeepney(jeepney);
    setIsViewOpen(true);
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (jeepney) => {
    setSelectedJeepney(jeepney);
    setIsDeleteOpen(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      plateNumber: '',
      type: 'Traditional Jeepney',
      capacity: getDefaultCapacity('Traditional Jeepney'),
      status: 'Available'
    });
    setFormErrors({});
    setSelectedJeepney(null);
  };

  // Compute stats metrics
  const totalJeepneys = jeepneys.length;
  const availableCount = jeepneys.filter((j) => j.status === 'Available').length;
  const activeCount = jeepneys.filter((j) => j.status === 'In Transit').length;
  const inactiveCount = jeepneys.filter((j) => j.status === 'Inactive').length;

  // Filter & Search & Sort Jeepneys
  const filteredJeepneys = jeepneys
    .filter((j) => {
      // Search term
      const term = searchQuery.toLowerCase().trim();
      const matchSearch =
        term === '' ||
        j.jeepneyNumber?.toLowerCase().includes(term) ||
        j.plateNumber?.toLowerCase().includes(term) ||
        j.type?.toLowerCase().includes(term);

      // Status Filter
      const matchStatus = statusFilter === 'All' || j.status === statusFilter;

      // Type Filter
      const matchType = typeFilter === 'All' || j.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Format clean comparison
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] p-4 rounded-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-32 h-32 rounded-full bg-[#F97316]/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2.5 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20">
            <Bus className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Jeepney Management Terminal</h3>
            <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Plan Routes. Manage Trips. Monitor Operations.</p>
          </div>
        </div>
        {canManageJeepneys && (
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-[#FFFFFF] rounded-lg shadow-md shadow-[#F97316]/10 hover:shadow-lg hover:shadow-[#F97316]/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Jeepney Unit</span>
          </button>
        )}
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

      {/* Bento Style Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Jeepneys */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Total Units</span>
            <div className="p-1 rounded bg-[#F97316]/5 border border-[#F97316]/10 text-[#F97316]">
              <Bus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#FFFFFF] font-mono">{loading ? '...' : totalJeepneys}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Registered Service Vehicles</span>
          </div>
        </div>

        {/* Available Jeepneys */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Available Units</span>
            <div className="p-1 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-emerald-400 font-mono">{loading ? '...' : availableCount}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Ready for immediate dispatch</span>
          </div>
        </div>

        {/* Active Jeepneys (In Transit) */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">In Transit Units</span>
            <div className="p-1 rounded bg-amber-500/5 border border-amber-500/10 text-amber-400">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-amber-400 font-mono">{loading ? '...' : activeCount}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Currently active on corridors</span>
          </div>
        </div>

        {/* Inactive Jeepneys */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Inactive Units</span>
            <div className="p-1 rounded bg-[#EF4444]/5 border border-[#EF4444]/10 text-[#EF4444]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#EF4444] font-mono">{loading ? '...' : inactiveCount}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">In maintenance or suspended</span>
          </div>
        </div>
      </div>

      {/* Database Connection Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#EF4444] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <strong>System Connection Error:</strong> {error}
          </div>
          <button
            onClick={fetchJeepneys}
            className="px-3 py-1.5 bg-[#EF4444]/20 text-[#EF4444] font-mono text-[10px] hover:bg-[#EF4444]/30 rounded transition-colors uppercase font-bold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Filter & Table Control Board */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden backdrop-blur-md">
        {/* Top bar search and status filters */}
        <div className="p-4 border-b border-[#27272A] flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by Jeepney Number, Plate, Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FFFFFF] placeholder:text-[#A1A1AA]/40 outline-none focus:border-[#F97316]/50 transition-all font-sans"
            />
          </div>

          {/* Filtering buttons & controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter select */}
            <div className="flex items-center gap-1.5 bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 rounded-lg text-xs text-[#FFFFFF]">
              <span className="text-[10px] font-mono text-[#A1A1AA] uppercase mr-1">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-[#FFFFFF] text-xs font-semibold cursor-pointer select-none"
              >
                <option value="All" className="bg-[#18181B] text-[#FFFFFF]">All Statuses</option>
                <option value="Available" className="bg-[#18181B] text-emerald-400 font-semibold">Available</option>
                <option value="In Transit" className="bg-[#18181B] text-amber-400 font-semibold">In Transit</option>
                <option value="Inactive" className="bg-[#18181B] text-[#EF4444] font-semibold">Inactive</option>
              </select>
            </div>

            {/* Type Filter select */}
            <div className="flex items-center gap-1.5 bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 rounded-lg text-xs text-[#FFFFFF]">
              <span className="text-[10px] font-mono text-[#A1A1AA] uppercase mr-1">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-[#FFFFFF] text-xs font-semibold cursor-pointer select-none"
              >
                <option value="All" className="bg-[#18181B] text-[#FFFFFF]">All Types</option>
                <option value="Traditional Jeepney" className="bg-[#18181B] text-[#FFFFFF]">Traditional</option>
                <option value="E-Jeep" className="bg-[#18181B] text-[#FFFFFF]">E-Jeep</option>
              </select>
            </div>

            {/* Clear All Filters Button */}
            {(searchQuery || statusFilter !== 'All' || typeFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setTypeFilter('All');
                }}
                className="px-3 py-2 border border-[#27272A] hover:bg-[#27272A]/30 text-[#A1A1AA] hover:text-[#FFFFFF] rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Loader Screen */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full"
            />
            <span className="text-xs font-mono text-[#A1A1AA]">Retrieving PUJ Unit Registry...</span>
          </div>
        ) : filteredJeepneys.length === 0 ? (
          /* Empty state */
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-[#27272A]/20 border border-[#27272A] text-[#A1A1AA]">
              <Bus className="w-8 h-8 text-[#A1A1AA]/50" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-sm font-semibold text-[#FFFFFF]">No Jeepney Units Found</h4>
              <p className="text-xs text-[#A1A1AA] mt-1.5">
                No registered units match your specified filters or search queries. Add a new unit to begin.
              </p>
            </div>
            {canManageJeepneys && (
              <button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
                className="px-3 py-1.5 bg-[#F97316]/10 border border-[#F97316]/20 hover:bg-[#F97316]/20 text-[#F97316] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Add New Unit
              </button>
            )}
          </div>
        ) : (
          /* Results Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] bg-[#18181B]/50 text-[10px] font-mono text-[#A1A1AA] tracking-wider uppercase select-none">
                  <th className="px-6 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => toggleSort('jeepneyNumber')}>
                    <div className="flex items-center gap-1">
                      <span>Jeepney No.</span>
                      {sortBy === 'jeepneyNumber' && <SlidersHorizontal className="w-3 h-3 text-[#F97316]" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => toggleSort('plateNumber')}>
                    <div className="flex items-center gap-1">
                      <span>Plate No.</span>
                      {sortBy === 'plateNumber' && <SlidersHorizontal className="w-3 h-3 text-[#F97316]" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => toggleSort('type')}>
                    <div className="flex items-center gap-1">
                      <span>Type</span>
                      {sortBy === 'type' && <SlidersHorizontal className="w-3 h-3 text-[#F97316]" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => toggleSort('capacity')}>
                    <div className="flex items-center gap-1">
                      <span>Capacity</span>
                      {sortBy === 'capacity' && <SlidersHorizontal className="w-3 h-3 text-[#F97316]" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortBy === 'status' && <SlidersHorizontal className="w-3 h-3 text-[#F97316]" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-[#FFFFFF] transition-colors" onClick={() => toggleSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      <span>Created Date</span>
                      {sortBy === 'createdAt' && <SlidersHorizontal className="w-3 h-3 text-[#F97316]" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {filteredJeepneys.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-[#18181B]/55 transition-colors text-xs text-[#FFFFFF] group"
                  >
                    {/* Jeepney Code/Number */}
                    <td className="px-6 py-4 font-mono font-bold text-[#FFFFFF]">
                      {item.jeepneyNumber}
                    </td>

                    {/* Plate Number */}
                    <td className="px-6 py-4 font-mono text-[#FFFFFF] font-semibold tracking-wide">
                      {item.plateNumber}
                    </td>

                    {/* Type Tag */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                        item.type === 'E-Jeep'
                          ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400'
                          : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>

                    {/* Capacity */}
                    <td className="px-6 py-4 font-mono text-[#A1A1AA]">
                      <span className="text-[#FFFFFF] font-semibold">{item.capacity}</span> max load
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold ${
                        item.status === 'Available'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : item.status === 'In Transit'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse'
                          : 'bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'Available'
                            ? 'bg-emerald-400'
                            : item.status === 'In Transit'
                            ? 'bg-amber-400'
                            : 'bg-[#EF4444]'
                        }`} />
                        {item.status}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-[#A1A1AA] font-mono">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '---'}
                    </td>

                    {/* Actions Panel */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openViewModal(item)}
                          title="View Details"
                          className="p-1.5 hover:bg-[#27272A]/60 hover:text-[#FFFFFF] text-[#A1A1AA] rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageJeepneys && (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit Unit"
                              className="p-1.5 hover:bg-amber-500/10 hover:text-amber-400 text-[#A1A1AA] rounded-md transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              disabled={item.status === 'In Transit'}
                              title={item.status === 'In Transit' ? 'Cannot delete active units in transit' : 'Delete Unit'}
                              className={`p-1.5 text-[#A1A1AA] rounded-md transition-colors cursor-pointer ${
                                item.status === 'In Transit'
                                  ? 'opacity-35 cursor-not-allowed'
                                  : 'hover:bg-[#EF4444]/10 hover:text-[#EF4444]'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ALL GLASSMORPHISM MODAL DIALOGS --- */}

      {/* 1. Add Jeepney Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsAddOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-md bg-[#18181B]/95 border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl z-10 relative backdrop-blur-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#18181B]/50">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-[#F97316]" />
                  <h3 className="font-display font-bold text-[#FFFFFF] text-base">Register Jeepney Unit</h3>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 rounded-md hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                {formErrors.form && (
                  <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.form}</span>
                  </div>
                )}

                {/* Plate Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Plate Number</label>
                  <input
                    type="text"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. NGR-3829 or AA-12345"
                    className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                      formErrors.plateNumber ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
                    }`}
                  />
                  {formErrors.plateNumber ? (
                    <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.plateNumber}</span>
                    </p>
                  ) : (
                    <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Standard hyphenated plate format is expected (e.g., AAA-1234)</span>
                  )}
                </div>

                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Jeepney Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Traditional Jeepney')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        formData.type === 'Traditional Jeepney'
                          ? 'bg-[#F97316]/10 border-[#F97316] text-[#F97316]'
                          : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#27272A]/80'
                      }`}
                    >
                      <span className="font-sans">Traditional</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('E-Jeep')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        formData.type === 'E-Jeep'
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                          : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#27272A]/80'
                      }`}
                    >
                      <span className="font-sans">E-Jeep</span>
                    </button>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Seating Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                      formErrors.capacity ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
                    }`}
                  />
                  {formErrors.capacity ? (
                    <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.capacity}</span>
                    </p>
                  ) : (
                    <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Pre-filled per type — adjust if this unit differs</span>
                  )}
                </div>

                {/* Status Options */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Operational Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Form Action Buttons */}
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Unit</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Edit Jeepney Modal */}
      <AnimatePresence>
        {isEditOpen && selectedJeepney && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsEditOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-md bg-[#18181B]/95 border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl z-10 relative backdrop-blur-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#18181B]/50">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" />
                  <h3 className="font-display font-bold text-[#FFFFFF] text-base">Edit Jeepney {selectedJeepney.jeepneyNumber}</h3>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="p-1 rounded-md hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {formErrors.form && (
                  <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.form}</span>
                  </div>
                )}

                {/* Auto-generated read-only number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Jeepney Identifier</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedJeepney.jeepneyNumber}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#09090B]/60 border border-[#27272A]/40 rounded-lg text-[#A1A1AA] outline-none font-mono font-bold"
                  />
                </div>

                {/* Plate Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Plate Number</label>
                  <input
                    type="text"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. NGR-3829"
                    className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                      formErrors.plateNumber ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
                    }`}
                  />
                  {formErrors.plateNumber ? (
                    <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.plateNumber}</span>
                    </p>
                  ) : (
                    <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Standard hyphenated format (e.g., AAA-1234)</span>
                  )}
                </div>

                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Jeepney Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Traditional Jeepney')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        formData.type === 'Traditional Jeepney'
                          ? 'bg-[#F97316]/10 border-[#F97316] text-[#F97316]'
                          : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#27272A]/80'
                      }`}
                    >
                      <span className="font-sans">Traditional</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('E-Jeep')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        formData.type === 'E-Jeep'
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                          : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#27272A]/80'
                      }`}
                    >
                      <span className="font-sans">E-Jeep</span>
                    </button>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Seating Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all placeholder:text-[#A1A1AA]/30 ${
                      formErrors.capacity ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
                    }`}
                  />
                  {formErrors.capacity ? (
                    <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.capacity}</span>
                    </p>
                  ) : (
                    <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Maximum allowed boarding passenger limit</span>
                  )}
                </div>

                {/* Status Options */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Operational Status</label>
                  {selectedJeepney.status === 'In Transit' ? (
                    <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#A1A1AA] flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Unit is currently in transit. Complete its active trip to modify status.</span>
                    </div>
                  ) : (
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Available">Available</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  )}
                </div>

                {/* Form Action Buttons */}
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
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update details</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. View Jeepney Details Modal */}
      <AnimatePresence>
        {isViewOpen && selectedJeepney && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsViewOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#18181B]/95 border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl z-10 relative backdrop-blur-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#18181B]/50">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-[#F97316]" />
                  <h3 className="font-display font-bold text-[#FFFFFF] text-base">Vehicle Identity File</h3>
                </div>
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="p-1 rounded-md hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* View Content */}
              <div className="p-6 space-y-5">
                {/* Visual Header */}
                <div className="flex items-center gap-4 bg-[#09090B] border border-[#27272A] p-4 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
                    <Bus className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#FFFFFF] font-mono leading-none">{selectedJeepney.jeepneyNumber}</h4>
                    <span className="text-[10px] font-mono text-[#A1A1AA] tracking-wider uppercase mt-1 block">REGISTRY FILE ATTACHED</span>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold ${
                      selectedJeepney.status === 'Available'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : selectedJeepney.status === 'In Transit'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        : 'bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]'
                    }`}>
                      {selectedJeepney.status}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center border-b border-[#27272A]/50 pb-2">
                    <span className="text-xs font-mono text-[#A1A1AA] uppercase">Plate License No.</span>
                    <span className="font-mono font-bold text-[#FFFFFF] tracking-wide text-sm">{selectedJeepney.plateNumber}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#27272A]/50 pb-2">
                    <span className="text-xs font-mono text-[#A1A1AA] uppercase">Service Type</span>
                    <span className="font-semibold text-[#FFFFFF]">{selectedJeepney.type}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#27272A]/50 pb-2">
                    <span className="text-xs font-mono text-[#A1A1AA] uppercase">Max Seating Capacity</span>
                    <span className="font-mono font-bold text-[#FFFFFF]">{selectedJeepney.capacity} passengers</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#27272A]/50 pb-2">
                    <span className="text-xs font-mono text-[#A1A1AA] uppercase">Date Registered</span>
                    <span className="font-mono text-[#FFFFFF]">
                      {selectedJeepney.createdAt ? new Date(selectedJeepney.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '---'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2">
                    <span className="text-xs font-mono text-[#A1A1AA] uppercase">Last Updated</span>
                    <span className="font-mono text-[#FFFFFF]">
                      {selectedJeepney.updatedAt ? new Date(selectedJeepney.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '---'}
                    </span>
                  </div>
                </div>

                {/* Dispatch Disclaimer */}
                <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-xl text-[10px] text-[#A1A1AA] flex items-start gap-2.5 leading-relaxed font-sans">
                  <Info className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    Only jeepneys logged as <strong className="text-emerald-400">Available</strong> can be drafted for operational schedules. No mongo identifier fields are rendered.
                  </div>
                </div>

                {/* Close Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setIsViewOpen(false)}
                    className="w-full py-2.5 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
                  >
                    Acknowledge and Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Delete Confirmation Dialog */}
      <AnimatePresence>
        {isDeleteOpen && selectedJeepney && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsDeleteOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-[#18181B]/95 border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl z-10 relative backdrop-blur-lg"
            >
              <div className="p-6 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-red-500/10 border border-red-500/20 text-[#EF4444] mb-1">
                  <Trash2 className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-base text-[#FFFFFF]">Decommission Jeepney Unit</h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Are you absolutely sure you want to decommission and permanently delete jeepney{' '}
                    <strong className="text-[#FFFFFF] font-mono">{selectedJeepney.jeepneyNumber} ({selectedJeepney.plateNumber})</strong>?
                    This action cannot be undone.
                  </p>
                </div>

                {/* Dialog buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => setIsDeleteOpen(false)}
                    className="flex-1 py-2.5 border border-[#27272A] hover:bg-[#18181B] text-xs font-semibold text-[#A1A1AA] hover:text-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={submitLoading}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-xs font-semibold text-[#FFFFFF] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Decommission</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Jeepneys;