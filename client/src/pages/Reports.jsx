import { useState, useEffect } from "react";
import api from "../services/api";

import {
  FileBarChart2,
  RefreshCw,
  RotateCcw,
  Calendar,
  Users,
  Bus,
  Route,
  PhilippinePeso,
  Activity,
  AlertCircle,
  Info
} from "lucide-react";

import { motion } from "framer-motion";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const reports = [
  { id: "jeepneys", name: "Jeepney Activity", icon: <Bus size={16} /> },
  { id: "routes", name: "Route Summary", icon: <Route size={16} /> },
  { id: "daily-trips", name: "Daily Trip Report", icon: <Activity size={16} /> },
  { id: "passengers", name: "Passenger Summary", icon: <Users size={16} /> },
  { id: "revenue", name: "Revenue Summary", icon: <PhilippinePeso size={16} /> }
];

const PRESETS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" }
];

const PRESET_LABELS = PRESETS.reduce((acc, p) => ({ ...acc, [p.id]: p.label }), { custom: "Custom Range" });

// Consistent status colors used across every chart in this module.
const STATUS_COLORS = {
  Scheduled: "#FBBF24",
  Departed: "#38BDF8",
  Arrived: "#34D399",
  Cancelled: "#EF4444"
};

const COLORS = ["#F97316", "#34D399", "#38BDF8", "#A78BFA", "#F472B6", "#FBBF24", "#71717A"];

const tooltipStyle = {
  backgroundColor: "#18181B",
  border: "1px solid #27272A",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#FFFFFF"
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

// Small reusable note for reports that are intentionally Arrived-only.
const ArrivedOnlyNote = () => (
  <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
    <Info size={14} className="shrink-0 mt-0.5" />
    <span>Based on confirmed (Arrived) trips only. Scheduled and Departed trips are excluded since their passenger/revenue figures are not yet final.</span>
  </div>
);

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null); // full API response
  const [selectedReportId, setSelectedReportId] = useState(reports[0].id);
  const [selectedReportName, setSelectedReportName] = useState(reports[0].name);

  const [period, setPeriod] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchReport = async (
    reportId,
    reportName,
    { silent = false, periodOverride, startOverride, endOverride } = {}
  ) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const activePeriod = periodOverride ?? period;
      const activeStart = startOverride ?? customStart;
      const activeEnd = endOverride ?? customEnd;

      const params = { period: activePeriod };
      if (activePeriod === "custom") {
        if (activeStart) params.startDate = activeStart;
        if (activeEnd) params.endDate = activeEnd;
      }

      const response = await api.get(`/reports/${reportId}`, { params });

      setReportData(response.data);
      setSelectedReportId(reportId);
      setSelectedReportName(reportName);
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || "Failed to generate report");
        setReportData(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load a default report immediately on page open
  useEffect(() => {
    fetchReport(reports[0].id, reports[0].name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent 30-second background refresh of whatever is currently being viewed
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReport(selectedReportId, selectedReportName, { silent: true });
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReportId, selectedReportName, period, customStart, customEnd]);

  const handleSelectReport = (reportId, reportName) => {
    if (reportId === selectedReportId) return; // already viewing this one
    fetchReport(reportId, reportName);
  };

  const handlePresetClick = (presetId) => {
    setPeriod(presetId);
    setCustomStart("");
    setCustomEnd("");
    fetchReport(selectedReportId, selectedReportName, {
      periodOverride: presetId,
      startOverride: "",
      endOverride: ""
    });
  };

  const handleCustomStartChange = (e) => {
    setCustomStart(e.target.value);
    setPeriod("custom");
  };

  const handleCustomEndChange = (e) => {
    setCustomEnd(e.target.value);
    setPeriod("custom");
  };

  const handleApplyFilter = () => {
    fetchReport(selectedReportId, selectedReportName);
  };

  const handleReset = () => {
    setPeriod("today");
    setCustomStart("");
    setCustomEnd("");
    fetchReport(selectedReportId, selectedReportName, {
      periodOverride: "today",
      startOverride: "",
      endOverride: ""
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <p className="text-zinc-400 mt-1">Transportation analytics and operational reports</p>
      </div>

      {/* FILTER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Calendar className="text-orange-500" />
            <h2 className="font-semibold text-lg">Report Period</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              onClick={handleApplyFilter}
              disabled={loading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={14} />
              Apply
            </button>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                period === preset.id
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-orange-500/50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="date"
            value={customStart}
            onChange={handleCustomStartChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
          />
          <input
            type="date"
            value={customEnd}
            onChange={handleCustomEndChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
          />
        </div>
      </motion.div>

      {/* REPORT TYPE TABS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 flex flex-wrap gap-2">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => handleSelectReport(report.id, report.name)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              selectedReportId === report.id
                ? "bg-orange-500 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {report.icon}
            {report.name}
          </button>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* RESULT — directly beneath the tabs, always visible, updates in place */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <FileBarChart2 className="text-orange-500" />
          <div>
            <h2 className="text-xl font-bold">{selectedReportName}</h2>
            <p className="text-xs text-zinc-500">
              Showing: {PRESET_LABELS[period] || "Custom Range"}
              {reportData?.dateFrom && period !== "all" && (
                <> · {formatDate(reportData.dateFrom)} – {formatDate(reportData.dateTo)}</>
              )}
            </p>
          </div>
          {loading && <RefreshCw className="animate-spin text-zinc-500 ml-auto" size={16} />}
        </div>

        {loading && !reportData && (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-orange-500" size={32} />
          </div>
        )}

        {reportData && (
          <>
            {selectedReportId === "jeepneys" && <JeepneyActivityReport data={reportData.data} />}
            {selectedReportId === "routes" && <RouteSummaryReport data={reportData.data} />}
            {selectedReportId === "daily-trips" && (
              <DailyTripReport data={reportData.data} trips={reportData.trips || []} />
            )}
            {selectedReportId === "passengers" && (
              <PassengerSummaryReport data={reportData.data} details={reportData.details || []} />
            )}
            {selectedReportId === "revenue" && <RevenueSummaryReport data={reportData.data} />}
          </>
        )}
      </motion.div>
    </div>
  );
};

// =====================================================
// Jeepney Activity Report
// =====================================================
const JeepneyActivityReport = ({ data }) => {
  const metrics = data.jeepneyMetrics || [];

  const totalTripsInPeriod = metrics.reduce((sum, j) => sum + (j.tripsInPeriod?.totalTrips || 0), 0);
  const totalArrived = metrics.reduce((sum, j) => sum + (j.tripsInPeriod?.arrivedTrips || 0), 0);
  const totalCancelled = metrics.reduce((sum, j) => sum + (j.tripsInPeriod?.cancelledTrips || 0), 0);

  const chartData = metrics.map((j) => ({
    name: j.plateNumber,
    Scheduled: j.tripsInPeriod?.scheduledTrips || 0,
    Departed: j.tripsInPeriod?.departedTrips || 0,
    Arrived: j.tripsInPeriod?.arrivedTrips || 0,
    Cancelled: j.tripsInPeriod?.cancelledTrips || 0
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Jeepneys" value={data.totalJeepneysCount ?? 0} />
        <StatCard label="Trips In Period" value={totalTripsInPeriod} />
        <StatCard label="Arrived Trips" value={totalArrived} accent="text-emerald-400" />
        <StatCard label="Cancelled Trips" value={totalCancelled} accent="text-red-400" />
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Trips per Jeepney</h3>
        {chartData.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-10">No trip activity recorded for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} />
              <YAxis stroke="#A1A1AA" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Scheduled" stackId="a" fill={STATUS_COLORS.Scheduled} />
              <Bar dataKey="Departed" stackId="a" fill={STATUS_COLORS.Departed} />
              <Bar dataKey="Arrived" stackId="a" fill={STATUS_COLORS.Arrived} />
              <Bar dataKey="Cancelled" stackId="a" fill={STATUS_COLORS.Cancelled} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Fleet Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[880px]">
            <thead>
              <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800">
                <th className="px-5 py-3">Plate No.</th>
                <th className="px-5 py-3">Jeepney No.</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Capacity</th>
                <th className="px-5 py-3">Current Status</th>
                <th className="px-5 py-3">Total Trips</th>
                <th className="px-5 py-3">Scheduled</th>
                <th className="px-5 py-3">Departed</th>
                <th className="px-5 py-3">Arrived</th>
                <th className="px-5 py-3">Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-zinc-500 text-xs">
                    No jeepneys found.
                  </td>
                </tr>
              ) : (
                metrics.map((j) => (
                  <tr key={j.jeepneyId} className="text-xs text-white border-b border-zinc-800 hover:bg-zinc-900/50">
                    <td className="px-5 py-3 font-mono">{j.plateNumber}</td>
                    <td className="px-5 py-3">{j.jeepneyNumber}</td>
                    <td className="px-5 py-3">{j.type}</td>
                    <td className="px-5 py-3">{j.capacity} pax</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          j.currentStatus === "Available"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : j.currentStatus === "In Transit"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}
                      >
                        {j.currentStatus || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-3">{j.tripsInPeriod?.totalTrips || 0}</td>
                    <td className="px-5 py-3 text-amber-400">{j.tripsInPeriod?.scheduledTrips || 0}</td>
                    <td className="px-5 py-3 text-sky-400">{j.tripsInPeriod?.departedTrips || 0}</td>
                    <td className="px-5 py-3 text-emerald-400">{j.tripsInPeriod?.arrivedTrips || 0}</td>
                    <td className="px-5 py-3 text-red-400">{j.tripsInPeriod?.cancelledTrips || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Route Summary Report
// =====================================================
const RouteSummaryReport = ({ data }) => {
  const routes = data.routeMetrics || [];

  const chartData = routes.map((r) => ({
    name: `${r.origin} - ${r.destination}`,
    Scheduled: r.scheduledTrips || 0,
    Departed: r.departedTrips || 0,
    Arrived: r.arrivedTrips || 0,
    Cancelled: r.cancelledTrips || 0
  }));

  return (
    <div className="space-y-6">
      <ArrivedOnlyNote />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Routes" value={data.routesCount ?? 0} />
        <StatCard label="Total Trips" value={routes.reduce((s, r) => s + r.totalTrips, 0)} />
        <StatCard label="Passengers Carried (Arrived)" value={routes.reduce((s, r) => s + r.totalPassengers, 0)} />
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Trips per Route</h3>
        {chartData.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-10">No route activity recorded for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="name" stroke="#A1A1AA" fontSize={10} />
              <YAxis stroke="#A1A1AA" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Scheduled" stackId="a" fill={STATUS_COLORS.Scheduled} />
              <Bar dataKey="Departed" stackId="a" fill={STATUS_COLORS.Departed} />
              <Bar dataKey="Arrived" stackId="a" fill={STATUS_COLORS.Arrived} />
              <Bar dataKey="Cancelled" stackId="a" fill={STATUS_COLORS.Cancelled} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Route Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[920px]">
            <thead>
              <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800">
                <th className="px-5 py-3">Origin</th>
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Fare</th>
                <th className="px-5 py-3">Total Trips</th>
                <th className="px-5 py-3">Scheduled</th>
                <th className="px-5 py-3">Departed</th>
                <th className="px-5 py-3">Arrived</th>
                <th className="px-5 py-3">Cancelled</th>
                <th className="px-5 py-3">Passengers (Arrived)</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-zinc-500 text-xs">
                    No routes found.
                  </td>
                </tr>
              ) : (
                routes.map((r) => (
                  <tr key={r.routeId} className="text-xs text-white border-b border-zinc-800 hover:bg-zinc-900/50">
                    <td className="px-5 py-3">{r.origin}</td>
                    <td className="px-5 py-3">{r.destination}</td>
                    <td className="px-5 py-3">₱{r.estimatedFare}</td>
                    <td className="px-5 py-3">{r.totalTrips}</td>
                    <td className="px-5 py-3 text-amber-400">{r.scheduledTrips || 0}</td>
                    <td className="px-5 py-3 text-sky-400">{r.departedTrips || 0}</td>
                    <td className="px-5 py-3 text-emerald-400">{r.arrivedTrips}</td>
                    <td className="px-5 py-3 text-red-400">{r.cancelledTrips}</td>
                    <td className="px-5 py-3">{r.totalPassengers}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Daily Trip Report
// =====================================================
const DailyTripReport = ({ data, trips }) => {
  const statusData = Object.entries(data.tripsByStatus || {}).map(([name, value]) => ({ name, value }));
  const hasStatusData = statusData.some((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Trips" value={data.totalTrips ?? 0} />
        <StatCard label="Arrived Trips" value={data.arrivedTrips ?? 0} accent="text-emerald-400" />
        <StatCard label="Cancelled Trips" value={data.cancelledTrips ?? 0} accent="text-red-400" />
        <StatCard label="Total Passengers" value={data.totalPassengers ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Trips by Status</h3>
          {!hasStatusData ? (
            <p className="text-xs text-zinc-500 text-center py-10">No trips recorded for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Recent Trips</h3>
          </div>
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-950">
                  <th className="px-4 py-3">Trip Code</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Passengers</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                      No trips found.
                    </td>
                  </tr>
                ) : (
                  trips.slice(0, 20).map((t) => (
                    <tr key={t._id} className="text-xs text-white border-b border-zinc-800 hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-mono">{t.tripCode}</td>
                      <td className="px-4 py-3">{formatDate(t.departureDate)}</td>
                      <td className="px-4 py-3">{t.route ? `${t.route.origin} - ${t.route.destination}` : "N/A"}</td>
                      <td className="px-4 py-3">{t.status}</td>
                      <td className="px-4 py-3">{t.passengerCount ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Passenger Summary Report
// =====================================================
const PassengerSummaryReport = ({ data, details }) => (
  <div className="space-y-6">
    <ArrivedOnlyNote />

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Passengers" value={data.totalPassengers ?? 0} />
      <StatCard label="Average Occupancy" value={`${data.averageOccupancy ?? 0}%`} />
      <StatCard label="Peak Trip" value={data.peakRecord?.tripCode ?? "N/A"} />
      <StatCard label="Peak Passenger Count" value={data.peakRecord?.passengerCount ?? 0} accent="text-orange-400" />
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-white">Passenger Records ({data.recordsCount ?? 0})</h3>
      </div>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-left min-w-[680px]">
          <thead>
            <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-950">
              <th className="px-5 py-3">Trip Code</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Route</th>
              <th className="px-5 py-3">Jeepney</th>
              <th className="px-5 py-3">Passengers</th>
              <th className="px-5 py-3">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 text-xs">
                  No passenger records found.
                </td>
              </tr>
            ) : (
              details.map((d) => (
                <tr key={d._id} className="text-xs text-white border-b border-zinc-800 hover:bg-zinc-900/50">
                  <td className="px-5 py-3 font-mono">{d.trip?.tripCode ?? "N/A"}</td>
                  <td className="px-5 py-3">{formatDate(d.trip?.departureDate)}</td>
                  <td className="px-5 py-3">
                    {d.trip?.route ? `${d.trip.route.origin} - ${d.trip.route.destination}` : "N/A"}
                  </td>
                  <td className="px-5 py-3">{d.trip?.jeepney?.plateNumber ?? "N/A"}</td>
                  <td className="px-5 py-3">{d.passengerCount}</td>
                  <td className="px-5 py-3">{d.occupancyRate ? `${d.occupancyRate}%` : "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// =====================================================
// Revenue Summary Report
// =====================================================
const RevenueSummaryReport = ({ data }) => {
  const byRoute = data.revenueByRoute || [];
  const chartData = byRoute.map((r) => ({ name: `${r.origin} - ${r.destination}`, value: r.revenue }));

  return (
    <div className="space-y-6">
      <ArrivedOnlyNote />

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Estimated Revenue"
          value={`₱${(data.overallEstimatedRevenue ?? 0).toLocaleString()}`}
          accent="text-orange-400"
        />
        <StatCard label="Arrived Trips" value={data.arrivedTripsCount ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue Share by Route</h3>
          {chartData.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-10">No revenue recorded for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {chartData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `₱${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Revenue Breakdown</h3>
          </div>
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-left min-w-[520px]">
              <thead>
                <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-950">
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Trips</th>
                  <th className="px-5 py-3">Passengers</th>
                  <th className="px-5 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {byRoute.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-500 text-xs">
                      No data.
                    </td>
                  </tr>
                ) : (
                  byRoute.map((r) => (
                    <tr key={r.routeId} className="text-xs text-white border-b border-zinc-800 hover:bg-zinc-900/50">
                      <td className="px-5 py-3">
                        {r.origin} - {r.destination}
                      </td>
                      <td className="px-5 py-3">{r.tripsCount ?? 0}</td>
                      <td className="px-5 py-3">{r.passengersCount ?? 0}</td>
                      <td className="px-5 py-3 text-orange-400">₱{r.revenue.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, accent = "text-white" }) => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
    <p className="text-[10px] uppercase font-mono text-zinc-500">{label}</p>
    <h4 className={`text-2xl font-black mt-1 ${accent}`}>{value}</h4>
  </div>
);

export default Reports;