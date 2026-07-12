import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Clock,
  DollarSign,
  AlertTriangle,
  BellRing
} from 'lucide-react';
import api from '../services/api';
import TripTable from '../layouts/tables/TripTable';
import FormModal from '../layouts/common/FormModal';
import ConfirmationModal from '../layouts/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';

const getTripEstimatedRevenue = (trip) => {
  if (!trip || trip.status !== 'Arrived') return 0;
  const fare = trip.route?.estimatedFare || 0;
  const passengers = trip.passengerCount || 0;
  return passengers * fare;
};

const Trips = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isDriver = user?.role === 'Driver';

  const [trips, setTrips] = useState([]);
  const [jeepneys, setJeepneys] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('departureDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [formData, setFormData] = useState({
    jeepney: '',
    route: '',
    schedule: '',
    driver: '',
    departureDate: new Date().toISOString().split('T')[0],
    actualDepartureTime: '',
    actualArrivalTime: '',
    passengerCount: 0,
    status: 'Scheduled'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Trips the Driver hasn't been notified about yet — captured BEFORE
  // acknowledging, so the banner/badges on this render still show them.
  const [driverNotifications, setDriverNotifications] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDriver) {
        const tripsRes = await api.get('/trips');
        if (tripsRes.data.success) {
          const data = tripsRes.data.data;
          setTrips(data);
          setDriverNotifications(data.filter(t => !t.driverNotified));

          // Acknowledge after capturing the snapshot above, so the sidebar
          // badge clears for next time without hiding this visit's alerts.
          const hasUnacknowledged = data.some(t => !t.driverNotified);
          if (hasUnacknowledged) {
            api.patch('/trips/acknowledge-notifications').catch(err => {
              console.error('Error acknowledging notifications:', err);
            });
          }
        }
        return;
      }

      const [tripsRes, jeepneysRes, routesRes, schedulesRes, driversRes] = await Promise.all([
        api.get('/trips'),
        api.get('/jeepneys'),
        api.get('/routes'),
        api.get('/schedules'),
        api.get('/users/drivers')
      ]);

      if (tripsRes.data.success) setTrips(tripsRes.data.data);

      if (jeepneysRes.data.success) setJeepneys(jeepneysRes.data.data);

      if (routesRes.data.success) {
        setRoutes(routesRes.data.data.filter(r => r.status === 'Active' || !r.status));
      }

      if (schedulesRes.data.success) {
        setSchedules(schedulesRes.data.data.filter(s => s.status === 'Active' || !s.status));
      }

      if (driversRes.data.success) setDrivers(driversRes.data.data);

    } catch (err) {
      console.error('Error fetching trips resources:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load trip operations registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => { await fetchData(); };
    load();
  }, []);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleRouteSelectChange = (e) => {
    const routeId = e.target.value;
    const matchingSchedules = schedules.filter(s => s.route && s.route._id === routeId);
    const nextSchedule = matchingSchedules.length > 0 ? matchingSchedules[0] : null;

    setFormData(prev => ({
      ...prev,
      route: routeId,
      schedule: nextSchedule ? nextSchedule._id : '',
      actualDepartureTime: nextSchedule ? nextSchedule.departureTime : '',
      actualArrivalTime: nextSchedule ? (nextSchedule.expectedArrivalTime || '') : ''
    }));

    if (formErrors.route) setFormErrors(prev => ({ ...prev, route: null }));
    if (formErrors.schedule) setFormErrors(prev => ({ ...prev, schedule: null }));
  };

  const handleScheduleSelectChange = (e) => {
    const scheduleId = e.target.value;
    const selectedSchedule = schedules.find(s => s._id === scheduleId);

    setFormData(prev => ({
      ...prev,
      schedule: scheduleId,
      actualDepartureTime: selectedSchedule ? selectedSchedule.departureTime : '',
      actualArrivalTime: selectedSchedule ? (selectedSchedule.expectedArrivalTime || '') : ''
    }));

    if (formErrors.schedule) setFormErrors(prev => ({ ...prev, schedule: null }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'passengerCount' ? (value === '' ? '' : Number(value)) : value
    }));

    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.jeepney) errors.jeepney = 'A fleet jeepney must be assigned.';
    if (!formData.route) errors.route = 'A transit corridor route is required.';
    if (!formData.schedule) errors.schedule = 'A departure schedule slot is required.';
    if (!formData.departureDate) errors.departureDate = 'Departure operation date is required.';

    if (formData.jeepney && (formData.passengerCount !== undefined && formData.passengerCount !== '')) {
      const selectedJeep = jeepneys.find(j => j._id === formData.jeepney);
      if (selectedJeep && formData.passengerCount > selectedJeep.capacity) {
        errors.passengerCount = `Passenger count cannot exceed maximum Jeepney capacity of ${selectedJeep.capacity}.`;
      } else if (formData.passengerCount < 0) {
        errors.passengerCount = 'Passenger count cannot be negative.';
      }
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (formData.actualDepartureTime && !timeRegex.test(formData.actualDepartureTime)) {
      errors.actualDepartureTime = 'Time must be in 24-hour HH:MM format.';
    }
    if (formData.actualArrivalTime && !timeRegex.test(formData.actualArrivalTime)) {
      errors.actualArrivalTime = 'Time must be in 24-hour HH:MM format.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const payload = { ...formData, driver: formData.driver || null };
      const response = await api.post('/trips', payload);
      if (response.data.success) {
        triggerSuccess(`Trip ${response.data.data.tripCode} scheduled successfully!`);
        setIsAddOpen(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Error creating trip:', err);
      setFormErrors({ form: err.response?.data?.message || 'Failed to schedule trip.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const payload = { ...formData, driver: formData.driver || null };
      const response = await api.put(`/trips/${selectedTrip._id}`, payload);
      if (response.data.success) {
        triggerSuccess(`Trip ${response.data.data.tripCode} updated successfully!`);
        setIsEditOpen(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Error updating trip:', err);
      setFormErrors({ form: err.response?.data?.message || 'Failed to update trip details.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTrip) return;
    setSubmitLoading(true);
    try {
      const response = await api.delete(`/trips/${selectedTrip._id}`);
      if (response.data.success) {
        triggerSuccess(`Trip record ${selectedTrip.tripCode} has been deleted.`);
        setIsDeleteOpen(false);
        setSelectedTrip(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
      triggerSuccess(`Error: ${err.response?.data?.message || 'Could not delete trip record.'}`);
      setIsDeleteOpen(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStartTrip = async (trip) => {
    setSubmitLoading(true);
    try {
      const nowTime = new Date().toTimeString().slice(0, 5);
      const response = await api.patch(`/trips/${trip._id}/status`, {
        status: 'Departed',
        actualDepartureTime: nowTime
      });
      if (response.data.success) {
        triggerSuccess(`Trip ${response.data.data.tripCode} marked as Departed!`);
        fetchData();
      }
    } catch (err) {
      console.error('Error starting trip:', err);
      triggerSuccess(`Error: ${err.response?.data?.message || 'Could not start trip.'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMarkArrived = async (trip) => {
    setSubmitLoading(true);
    try {
      const nowTime = new Date().toTimeString().slice(0, 5);
      const response = await api.patch(`/trips/${trip._id}/status`, {
        status: 'Arrived',
        actualArrivalTime: nowTime
      });
      if (response.data.success) {
        triggerSuccess(`Arrival reported for trip ${response.data.data.tripCode}! Waiting for Terminal Personnel confirmation.`);
        fetchData();
      }
    } catch (err) {
      console.error('Error reporting arrival:', err);
      triggerSuccess(`Error: ${err.response?.data?.message || 'Could not report arrival.'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleConfirmArrival = async (trip) => {
    setSubmitLoading(true);
    try {
      const response = await api.patch(`/trips/${trip._id}/confirm-arrival`);
      if (response.data.success) {
        triggerSuccess(`Arrival confirmed for trip ${response.data.data.tripCode}!`);
        fetchData();
      }
    } catch (err) {
      console.error('Error confirming arrival:', err);
      triggerSuccess(`Error: ${err.response?.data?.message || 'Could not confirm arrival.'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const openAddModal = () => { resetForm(); setIsAddOpen(true); };

  const openEditModal = (trip) => {
    setSelectedTrip(trip);
    setFormData({
      jeepney: trip.jeepney ? trip.jeepney._id : '',
      route: trip.route ? trip.route._id : '',
      schedule: trip.schedule ? trip.schedule._id : '',
      driver: trip.driver ? trip.driver._id : '',
      departureDate: trip.departureDate ? new Date(trip.departureDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      actualDepartureTime: trip.actualDepartureTime || '',
      actualArrivalTime: trip.actualArrivalTime || '',
      passengerCount: trip.passengerCount || 0,
      status: trip.status || 'Scheduled'
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const openDeleteModal = (trip) => { setSelectedTrip(trip); setIsDeleteOpen(true); };

  const resetForm = () => {
    const firstJeepneyId = jeepneys.length > 0 ? jeepneys[0]._id : '';
    const firstRouteId = routes.length > 0 ? routes[0]._id : '';
    const filteredSchedules = schedules.filter(s => s.route && s.route._id === firstRouteId);
    const firstSchedule = filteredSchedules.length > 0 ? filteredSchedules[0] : null;

    setFormData({
      jeepney: firstJeepneyId,
      route: firstRouteId,
      schedule: firstSchedule ? firstSchedule._id : '',
      driver: '',
      departureDate: new Date().toISOString().split('T')[0],
      actualDepartureTime: firstSchedule ? firstSchedule.departureTime : '',
      actualArrivalTime: firstSchedule ? (firstSchedule.expectedArrivalTime || '') : '',
      passengerCount: 0,
      status: 'Scheduled'
    });
    setFormErrors({});
    setSelectedTrip(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const totalTrips = trips.length;
  const departedTrips = trips.filter(t => t.status === 'Departed').length;
  const arrivedTrips = trips.filter(t => t.status === 'Arrived').length;
  const totalEstRevenue = trips.reduce((acc, t) => acc + getTripEstimatedRevenue(t), 0);

  const pendingArrivals = trips.filter(t => t.arrivalReported && t.status !== 'Arrived');

  const currentFormRouteSchedules = schedules.filter(s => s.route && s.route._id === formData.route);

  const filteredTrips = trips
    .filter((trip) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        (trip.tripCode && trip.tripCode.toLowerCase().includes(query)) ||
        (trip.jeepney &&
          (trip.jeepney.plateNumber.toLowerCase().includes(query) ||
            trip.jeepney.jeepneyNumber.toLowerCase().includes(query))) ||
        (trip.route &&
          (trip.route.origin.toLowerCase().includes(query) ||
            trip.route.destination.toLowerCase().includes(query) ||
            trip.route.routeCode.toLowerCase().includes(query)));

      const matchesStatus = statusFilter === 'All' || trip.status === statusFilter;

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] p-4 rounded-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-32 h-32 rounded-full bg-[#F97316]/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2.5 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20">
            <Calendar className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#FFFFFF]">
              {isDriver ? 'My Trips' : 'Daily Trip Dispatcher'}
            </h3>
            <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
              {isDriver ? 'View and update the status of your assigned trips.' : 'Plan Routes. Manage Trips. Monitor Operations.'}
            </p>
          </div>
        </div>
        {!isAdmin && !isDriver && (
          <button
            onClick={openAddModal}
            disabled={routes.length === 0 || schedules.length === 0 || jeepneys.length === 0}
            className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-[#FFFFFF] rounded-lg shadow-md shadow-[#F97316]/10 hover:shadow-lg hover:shadow-[#F97316]/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch New Trip</span>
          </button>
        )}
      </div>

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

      {/* Pending arrival confirmations banner — Terminal Personnel/Admin */}
      {!isDriver && !loading && pendingArrivals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-3 shadow-md"
        >
          <BellRing className="w-5 h-5 shrink-0 animate-pulse" />
          <div className="flex-1 font-sans">
            <strong>{pendingArrivals.length} trip{pendingArrivals.length > 1 ? 's' : ''}</strong>{' '}
            {pendingArrivals.length > 1 ? 'have' : 'has'} been reported as arrived by the driver and{' '}
            {pendingArrivals.length > 1 ? 'need' : 'needs'} your confirmation below.
          </div>
        </motion.div>
      )}

      {/* New assignment / cancellation banner — Driver only */}
      {isDriver && !loading && driverNotifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex flex-col gap-1.5 shadow-md"
        >
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 shrink-0" />
            <strong className="font-bold">Trip Updates</strong>
          </div>
          <ul className="list-disc pl-7 space-y-1 font-sans">
            {driverNotifications.map(t => (
              <li key={t._id}>
                {t.status === 'Cancelled'
                  ? `Trip ${t.tripCode} (${t.route?.origin} → ${t.route?.destination}) has been cancelled.`
                  : `Terminal Personnel has assigned/scheduled trip ${t.tripCode} (${t.route?.origin} → ${t.route?.destination}) for you.`}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {!isDriver && !loading && (routes.length === 0 || schedules.length === 0 || jeepneys.length === 0) && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex flex-col gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <strong className="font-bold">Dispatching Prerequisites Incomplete:</strong>
          </div>
          <ul className="list-disc pl-7 space-y-1 font-sans">
            {jeepneys.length === 0 && <li>No active jeepneys in fleet. Please configure Jeepneys.</li>}
            {routes.length === 0 && <li>No active travel routes. Please configure Route corridors.</li>}
            {schedules.length === 0 && <li>No active schedule departure slots available. Please configure Schedules.</li>}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">{isDriver ? 'My Total Trips' : 'Total Dispatches'}</span>
            <div className="p-1 rounded bg-[#F97316]/5 border border-[#F97316]/10 text-[#F97316]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#FFFFFF] font-mono">{loading ? '...' : totalTrips}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">{isDriver ? 'Trips assigned to you' : 'Recorded Trip operations'}</span>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Departed Trips</span>
            <div className="p-1 rounded bg-amber-500/5 border border-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-amber-400 font-mono">{loading ? '...' : departedTrips}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Currently on-road (transit)</span>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase">Arrived / Completed</span>
            <div className="p-1 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-emerald-400 font-mono">{loading ? '...' : arrivedTrips}</h4>
            <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Successfully completed trips</span>
          </div>
        </div>

        {!isDriver && (
          <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#A1A1AA] uppercase">Est. Revenue</span>
              <div className="p-1 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black text-emerald-400 font-mono">
                ₱{loading ? '...' : totalEstRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <span className="text-[10px] text-[#A1A1AA] mt-0.5 block">Summed estimated revenue (Arrived trips)</span>
            </div>
          </div>
        )}
      </div>

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

      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-[#27272A] flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by Trip Code, Jeepney Plate, Route Origin/Dest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#FFFFFF] placeholder:text-[#A1A1AA]/40 outline-none focus:border-[#F97316]/50 transition-all font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 rounded-lg text-xs text-[#FFFFFF]">
              <span className="text-[10px] font-mono text-[#A1A1AA] uppercase mr-1">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-[#FFFFFF] text-xs font-semibold cursor-pointer select-none"
              >
                <option value="All" className="bg-[#18181B] text-[#FFFFFF]">All Statuses</option>
                <option value="Scheduled" className="bg-[#18181B] text-sky-400 font-semibold">Scheduled</option>
                <option value="Departed" className="bg-[#18181B] text-amber-400 font-semibold">Departed</option>
                <option value="Arrived" className="bg-[#18181B] text-emerald-400 font-semibold">Arrived</option>
                <option value="Cancelled" className="bg-[#18181B] text-[#EF4444] font-semibold">Cancelled</option>
              </select>
            </div>

            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
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
            <span className="text-xs font-mono text-[#A1A1AA]">Retrieving Trip Dispatches...</span>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-[#27272A]/20 border border-[#27272A] text-[#A1A1AA]">
              <Calendar className="w-8 h-8 text-[#A1A1AA]/50" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-sm font-semibold text-[#FFFFFF]">
                {isDriver ? 'No Trips Assigned' : 'No Trips Dispatched'}
              </h4>
              <p className="text-xs text-[#A1A1AA] mt-1.5">
                {isDriver
                  ? 'You have no trips assigned yet, or none match your current filters.'
                  : 'No active trip dispatches match your search filters. Dispatch a vehicle to track on-road operations.'}
              </p>
            </div>
            {!isDriver && routes.length > 0 && schedules.length > 0 && jeepneys.length > 0 && (
              <button
                onClick={openAddModal}
                className="px-3 py-1.5 bg-[#F97316]/10 border border-[#F97316]/20 hover:bg-[#F97316]/20 text-[#F97316] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Dispatch Trip
              </button>
            )}
          </div>
        ) : (
          <TripTable
            trips={filteredTrips}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            isDriver={isDriver}
            onStartTrip={handleStartTrip}
            onMarkArrived={handleMarkArrived}
            onConfirmArrival={handleConfirmArrival}
          />
        )}
      </div>

      <FormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Dispatch Operations Trip"
        icon={<Calendar className="w-5 h-5" />}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 leading-normal font-sans">{formErrors.form}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Assign Fleet Jeepney</label>
            <select
              name="jeepney"
              value={formData.jeepney}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer ${
                formErrors.jeepney ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              <option value="">Select Jeepney</option>
              {jeepneys.map((jp) => (
                <option key={jp._id} value={jp._id}>
                  {jp.plateNumber} • {jp.jeepneyNumber} ({jp.type}) • Cap: {jp.capacity} pax
                </option>
              ))}
            </select>
            {formErrors.jeepney && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.jeepney}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Assign Driver</label>
            <select
              name="driver"
              value={formData.driver}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer"
            >
              <option value="">Unassigned</option>
              {drivers.map((drv) => (
                <option key={drv._id} value={drv._id}>
                  {drv.fullName} (@{drv.username}){drv.hasOngoingTrip ? ' — ⚠ Has Ongoing Trip' : ''}
                </option>
              ))}
            </select>
            {drivers.length === 0 ? (
              <span className="text-[9px] font-mono text-amber-400 block mt-1">No active Driver accounts registered. This trip will remain unassigned.</span>
            ) : (
              <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Drivers marked "Has Ongoing Trip" are still on an active run — assign with caution.</span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Transit Corridor Route</label>
            <select
              name="route"
              value={formData.route}
              onChange={handleRouteSelectChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer ${
                formErrors.route ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              <option value="">Select Route</option>
              {routes.map((rt) => (
                <option key={rt._id} value={rt._id}>
                  {rt.routeCode}: {rt.origin} to {rt.destination} (₱{rt.estimatedFare})
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

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Departure Schedule Slot</label>
            <select
              name="schedule"
              value={formData.schedule}
              onChange={handleScheduleSelectChange}
              disabled={!formData.route}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                formErrors.schedule ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              <option value="">Select Departure Time</option>
              {currentFormRouteSchedules.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.scheduleCode}: {sc.departureTime} (Expected Arr: {sc.expectedArrivalTime || '--:--'})
                </option>
              ))}
            </select>
            {formErrors.schedule && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.schedule}</span>
              </p>
            )}
            {formData.route && currentFormRouteSchedules.length === 0 && (
              <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1 font-sans">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>No active schedules registered for this corridor route.</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Departure Date</label>
            <input
              type="date"
              name="departureDate"
              value={formData.departureDate}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all cursor-pointer ${
                formErrors.departureDate ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.departureDate && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.departureDate}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Current Passenger Count</label>
            <input
              type="number"
              name="passengerCount"
              value={formData.passengerCount}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.passengerCount ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.passengerCount ? (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.passengerCount}</span>
              </p>
            ) : (
              <span className="text-[9px] font-mono text-[#A1A1AA] block mt-1">Passenger headcount cannot exceed assigned vehicle capacity. Revenue calculates as pax * route fare.</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#A1A1AA] uppercase block">Actual Departure Time</label>
              <input
                type="time"
                name="actualDepartureTime"
                value={formData.actualDepartureTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                  formErrors.actualDepartureTime ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
                }`}
              />
              {formErrors.actualDepartureTime && (
                <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.actualDepartureTime}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#A1A1AA] uppercase block">Actual Arrival Time</label>
              <input
                type="time"
                name="actualArrivalTime"
                value={formData.actualArrivalTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                  formErrors.actualArrivalTime ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
                }`}
              />
              {formErrors.actualArrivalTime && (
                <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.actualArrivalTime}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Operational Dispatch Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Departed">Departed</option>
              <option value="Arrived">Arrived</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

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
              {submitLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Dispatch Trip</span>}
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={selectedTrip ? `Modify Trip Dispatch: ${selectedTrip.tripCode}` : 'Modify Trip'}
        icon={<Calendar className="w-5 h-5 text-amber-500" />}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formErrors.form && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 leading-normal font-sans">{formErrors.form}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Assign Fleet Jeepney</label>
            <select
              name="jeepney"
              value={formData.jeepney}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer ${
                formErrors.jeepney ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              <option value="">Select Jeepney</option>
              {jeepneys.map((jp) => (
                <option key={jp._id} value={jp._id}>
                  {jp.plateNumber} • {jp.jeepneyNumber} ({jp.type}) • Cap: {jp.capacity} pax
                </option>
              ))}
            </select>
            {formErrors.jeepney && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.jeepney}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Assign Driver</label>
            <select
              name="driver"
              value={formData.driver}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer"
            >
              <option value="">Unassigned</option>
              {drivers.map((drv) => (
                <option key={drv._id} value={drv._id}>
                  {drv.fullName} (@{drv.username}){drv.hasOngoingTrip ? ' — ⚠ Has Ongoing Trip' : ''}
                </option>
              ))}
            </select>
            {drivers.length === 0 && (
              <span className="text-[9px] font-mono text-amber-400 block mt-1">No active Driver accounts registered. This trip will remain unassigned.</span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Transit Corridor Route</label>
            <select
              name="route"
              value={formData.route}
              onChange={handleRouteSelectChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer ${
                formErrors.route ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              <option value="">Select Route</option>
              {routes.map((rt) => (
                <option key={rt._id} value={rt._id}>
                  {rt.routeCode}: {rt.origin} to {rt.destination} (₱{rt.estimatedFare})
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

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Departure Schedule Slot</label>
            <select
              name="schedule"
              value={formData.schedule}
              onChange={handleScheduleSelectChange}
              disabled={!formData.route}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                formErrors.schedule ? 'border-[#EF4444]' : 'border-[#27272A]'
              }`}
            >
              <option value="">Select Departure Time</option>
              {currentFormRouteSchedules.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.scheduleCode}: {sc.departureTime} (Expected Arr: {sc.expectedArrivalTime || '--:--'})
                </option>
              ))}
            </select>
            {formErrors.schedule && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.schedule}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Departure Date</label>
            <input
              type="date"
              name="departureDate"
              value={formData.departureDate}
              onChange={handleInputChange}
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all cursor-pointer ${
                formErrors.departureDate ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.departureDate && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.departureDate}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Current Passenger Count</label>
            <input
              type="number"
              name="passengerCount"
              value={formData.passengerCount}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3.5 py-2.5 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                formErrors.passengerCount ? 'border-[#EF4444] focus:border-[#EF4444]/50' : 'border-[#27272A] focus:border-[#F97316]/50'
              }`}
            />
            {formErrors.passengerCount && (
              <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formErrors.passengerCount}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#A1A1AA] uppercase block">Actual Departure Time</label>
              <input
                type="time"
                name="actualDepartureTime"
                value={formData.actualDepartureTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                  formErrors.actualDepartureTime ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
                }`}
              />
              {formErrors.actualDepartureTime && (
                <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.actualDepartureTime}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#A1A1AA] uppercase block">Actual Arrival Time</label>
              <input
                type="time"
                name="actualArrivalTime"
                value={formData.actualArrivalTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-xs bg-[#09090B] border rounded-lg text-[#FFFFFF] outline-none transition-all ${
                  formErrors.actualArrivalTime ? 'border-[#EF4444]' : 'border-[#27272A] focus:border-[#F97316]/50'
                }`}
              />
              {formErrors.actualArrivalTime && (
                <p className="text-[10px] text-[#EF4444] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.actualArrivalTime}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A1A1AA] uppercase block">Operational Dispatch Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] outline-none focus:border-[#F97316]/50 transition-all cursor-pointer"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Departed">Departed</option>
              <option value="Arrived">Arrived</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

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
              {submitLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Trip</span>}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Trip Dispatch Record?"
        message={selectedTrip ? `This will permanently delete trip dispatch record ${selectedTrip.tripCode} from the system logging registry. All passenger counts, times, and estimated revenue records (₱${getTripEstimatedRevenue(selectedTrip).toFixed(2)}) associated with this run will be deleted. Continue?` : ''}
        confirmText="Yes, delete trip"
        cancelText="Cancel"
        type="danger"
        isLoading={submitLoading}
      />
    </div>
  );
};

export default Trips;