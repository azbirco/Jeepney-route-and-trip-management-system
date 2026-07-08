import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import RouteTable from '../layouts/tables/RouteTable';
import FormModal from '../layouts/common/FormModal';
import ConfirmationModal from '../layouts/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';

const MUNICIPALITIES = ['Solano', 'Bayombong', 'Bagabag', 'Bambang', 'Aritao', 'Sta. Fe'];

const Routes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Core state
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('routeCode');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal open states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form state
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [formData, setFormData] = useState({
    origin: 'Solano',
    destination: 'Bayombong',
    estimatedTravelTime: 30,
    estimatedFare: 25,
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch routes from server
  const fetchRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/routes');
      if (response.data.success) {
        setRoutes(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to retrieve routes registry.');
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to service routes.');
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const loadRoutes = async () => {
    await fetchRoutes();
  };

  loadRoutes();
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'estimatedTravelTime' || name === 'estimatedFare') 
        ? (value === '' ? '' : Number(value)) 
        : value
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validation
  const validateForm = () => {
    const errors = {};

    if (formData.origin === formData.destination) {
      errors.destination = 'Origin and Destination municipalities cannot be identical.';
    }

    if (!formData.estimatedTravelTime || formData.estimatedTravelTime <= 0) {
      errors.estimatedTravelTime = 'Travel time must be greater than zero.';
    } else if (!Number.isInteger(formData.estimatedTravelTime)) {
      errors.estimatedTravelTime = 'Travel time must be a whole number of minutes.';
    }

    if (!formData.estimatedFare || formData.estimatedFare <= 0) {
      errors.estimatedFare = 'Estimated fare must be greater than zero.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create Route
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const response = await api.post('/routes', formData);
      if (response.data.success) {
        triggerSuccess(`Route ${response.data.data.routeCode} (${response.data.data.origin} to ${response.data.data.destination}) created successfully!`);
        setIsAddOpen(false);
        resetForm();
        fetchRoutes();
      }
    } catch (err) {
      console.error('Error creating route:', err);
      const serverMsg = err.response?.data?.message || 'Failed to create route.';
      if (serverMsg.toLowerCase().includes('duplicate') || serverMsg.toLowerCase().includes('already exists')) {
        setFormErrors({ form: 'A travel route with this origin and destination combination is already registered.' });
      } else {
        setFormErrors({ form: serverMsg });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Edit Route
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const response = await api.put(`/routes/${selectedRoute._id}`, formData);
      if (response.data.success) {
        triggerSuccess(`Route ${response.data.data.routeCode} details updated successfully!`);
        setIsEditOpen(false);
        resetForm();
        fetchRoutes();
      }
    } catch (err) {
      console.error('Error updating route:', err);
      const serverMsg = err.response?.data?.message || 'Failed to update route.';
      if (serverMsg.toLowerCase().includes('duplicate') || serverMsg.toLowerCase().includes('already exists')) {
        setFormErrors({ form: 'A travel route with this origin and destination combination is already registered.' });
      } else {
        setFormErrors({ form: serverMsg });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete Route
  const handleDeleteConfirm = async () => {
    if (!selectedRoute) return;
    setSubmitLoading(true);
    try {
      const response = await api.delete(`/routes/${selectedRoute._id}`);
      if (response.data.success) {
        triggerSuccess(`Route ${selectedRoute.routeCode} was deleted successfully.`);
        setIsDeleteOpen(false);
        setSelectedRoute(null);
        fetchRoutes();
      }
    } catch (err) {
      console.error('Error deleting route:', err);
      triggerSuccess(`Error: ${err.response?.data?.message || 'Could not delete corridor route.'}`);
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

  const openEditModal = (route) => {
    setSelectedRoute(route);
    setFormData({
      origin: route.origin,
      destination: route.destination,
      estimatedTravelTime: route.estimatedTravelTime,
      estimatedFare: route.estimatedFare,
      status: route.status || 'Active'
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const openDeleteModal = (route) => {
    setSelectedRoute(route);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      origin: 'Solano',
      destination: 'Bayombong',
      estimatedTravelTime: 30,
      estimatedFare: 25,
      status: 'Active'
    });
    setFormErrors({});
    setSelectedRoute(null);
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
  const totalRoutes = routes.length;
  const activeRoutes = routes.filter((r) => r.status === 'Active' || !r.status).length;
  const inactiveRoutes = routes.filter((r) => r.status === 'Inactive').length;
  const averageFare = routes.length
    ? routes.reduce((acc, r) => acc + (r.estimatedFare || 0), 0) / routes.length
    : 0;

  // Filter & Search & Sort routing data
  const filteredRoutes = routes
    .filter((route) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        (route.routeCode && route.routeCode.toLowerCase().includes(query)) ||
        (route.origin && route.origin.toLowerCase().includes(query)) ||
        (route.destination && route.destination.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'All' || route.status === statusFilter;

      return matchesSearch && matchesStatus;
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

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] p-4 rounded-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-32 h-32 rounded-full bg-[#F97316]/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2.5 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20">
            <Map className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Transit Corridor Route Manager</h3>
            <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Plan Routes. Manage Trips. Monitor Operations.</p>
          </div>
        </div>
        {!isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-[#FFFFFF] rounded-lg shadow-md shadow-[#F97316]/10 hover:shadow-lg hover:shadow-[#F97316]/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Travel Route</span>
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

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Routes */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Total Corridors</span>
            <div className="p-1 rounded bg-[#F97316]/5 border border-[#F97316]/10 text-[#F97316]">
              <Map className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#FFFFFF] font-mono">{loading ? '...' : totalRoutes}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Configured Provincial Paths</span>
          </div>
        </div>

        {/* Active Routes */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Active Corridors</span>
            <div className="p-1 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-emerald-400 font-mono">{loading ? '...' : activeRoutes}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Approved active lanes</span>
          </div>
        </div>

        {/* Inactive Routes */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Suspended Lanes</span>
            <div className="p-1 rounded bg-[#EF4444]/5 border border-[#EF4444]/10 text-[#EF4444]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#EF4444] font-mono">{loading ? '...' : inactiveRoutes}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Temporarily closed lanes</span>
          </div>
        </div>

        {/* Average Fare */}
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Average Base Fare</span>
            <div className="p-1 rounded bg-sky-500/5 border border-sky-500/10 text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-sky-400 font-mono">
              ₱{loading ? '...' : averageFare.toFixed(2)}
            </h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Estimated passenger cost</span>
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
            onClick={fetchRoutes}
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
              placeholder="Search by Route Code, Origin, Destination..."
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
            <span className="text-xs font-mono text-[#A1A1AA]">Retrieving Corridor Records...</span>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-[#27272A]/20 border border-[#27272A] text-[#A1A1AA]">
              <Map className="w-8 h-8 text-[#A1A1AA]/50" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-sm font-semibold text-[#FFFFFF]">No Routes Registered</h4>
              <p className="text-xs text-[#A1A1AA] mt-1.5">
                No travel corridors match your filters. Register a new route combination to proceed.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-3 py-1.5 bg-[#F97316]/10 border border-[#F97316]/20 hover:bg-[#F97316]/20 text-[#F97316] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Add Route
            </button>
          </div>
        ) : (
          <RouteTable
            routes={filteredRoutes}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </div>

      {/* --- MODALS DIALOGS --- */}

      {/* Add Route Form Modal */}
      <FormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Travel Route"
        icon={<Map className="w-5 h-5" />}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.form}</span>
            </div>
          )}

          {/* Origin Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Origin Municipality</label>
            <select
              name="origin"
              value={formData.origin}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer"
            >
              {MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
          </div>

          {/* Destination Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Destination Municipality</label>
            <select
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer ${
                formErrors.destination ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              {MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
            {formErrors.destination && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.destination}</span>
              </p>
            )}
          </div>

          {/* Travel Time Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Travel Time (Minutes)</label>
            <input
              type="number"
              name="estimatedTravelTime"
              value={formData.estimatedTravelTime}
              onChange={handleInputChange}
              min="1"
              placeholder="e.g. 30"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.estimatedTravelTime ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.estimatedTravelTime ? (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.estimatedTravelTime}</span>
              </p>
            ) : (
              <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Average travel length over corridor in minutes</span>
            )}
          </div>

          {/* Estimated Fare */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Estimated Base Fare (₱)</label>
            <input
              type="number"
              name="estimatedFare"
              value={formData.estimatedFare}
              onChange={handleInputChange}
              step="0.01"
              min="0.01"
              placeholder="e.g. 25.00"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.estimatedFare ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.estimatedFare && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.estimatedFare}</span>
              </p>
            )}
          </div>

          {/* Status Options */}
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
                <span>Register Route</span>
              )}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Edit Route Form Modal */}
      <FormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={selectedRoute ? `Modify Route: ${selectedRoute.routeCode}` : 'Modify Route'}
        icon={<Map className="w-5 h-5 text-amber-500" />}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.form}</span>
            </div>
          )}

          {/* Origin Dropdown (Read Only or change) */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Origin Municipality</label>
            <select
              name="origin"
              value={formData.origin}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer"
            >
              {MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
          </div>

          {/* Destination Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Destination Municipality</label>
            <select
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer ${
                formErrors.destination ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              {MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
            {formErrors.destination && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.destination}</span>
              </p>
            )}
          </div>

          {/* Travel Time Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Travel Time (Minutes)</label>
            <input
              type="number"
              name="estimatedTravelTime"
              value={formData.estimatedTravelTime}
              onChange={handleInputChange}
              min="1"
              placeholder="e.g. 30"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.estimatedTravelTime ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.estimatedTravelTime && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.estimatedTravelTime}</span>
              </p>
            )}
          </div>

          {/* Estimated Fare */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Estimated Base Fare (₱)</label>
            <input
              type="number"
              name="estimatedFare"
              value={formData.estimatedFare}
              onChange={handleInputChange}
              step="0.01"
              min="0.01"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.estimatedFare ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.estimatedFare && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.estimatedFare}</span>
              </p>
            )}
          </div>

          {/* Status Options */}
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
                <span>Update Route</span>
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
        title="Delete Corridor Route?"
        message={selectedRoute ? `This will permanently delete route ${selectedRoute.routeCode} (${selectedRoute.origin} to ${selectedRoute.destination}) from the system registry. Active schedules mapping to this corridor will fail to function. Proceed with caution.` : ''}
        confirmText="Yes, delete route"
        cancelText="Cancel"
        type="danger"
        isLoading={submitLoading}
      />
    </div>
  );
};

export default Routes;
