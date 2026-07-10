import { useState, useEffect } from "react";
import api from "../services/api";

import {
  FileBarChart2,
  RefreshCw,
  Calendar,
  Users,
  Bus,
  Route,
  PhilippinePeso,
  Activity,
  AlertCircle
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
  { id: "jeepneys", name: "Jeepney Activity", icon: <Bus /> },
  { id: "routes", name: "Route Summary", icon: <Route /> },
  { id: "daily-trips", name: "Daily Trip Report", icon: <Activity /> },
  { id: "passengers", name: "Passenger Summary", icon: <Users /> },
  { id: "revenue", name: "Revenue Summary", icon: <PhilippinePeso /> }
];

const COLORS = ["#F97316", "#34D399", "#38BDF8", "#A78BFA", "#F472B6", "#FBBF24", "#71717A"];

const tooltipStyle = {
  backgroundColor: "#18181B",
  border: "1px solid #27272A",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#FFFFFF"
};

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null); // full API response
  const [selectedReportId, setSelectedReportId] = useState(reports[0].id);
  const [selectedReportName, setSelectedReportName] = useState(reports[0].name);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async (reportId, reportName) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/reports/${reportId}`, { params });

      setReportData(response.data);
      setSelectedReportId(reportId);
      setSelectedReportName(reportName);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load a default report immediately on page open
  useEffect(() => {
    fetchReport(reports[0].id, reports[0].name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilter = () => {
    fetchReport(selectedReportId, selectedReportName);
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

          <button
            onClick={handleApplyFilter}
            disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={14} />
            Apply
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white"
          />
        </div>
      </motion.div>

      {/* REPORT TYPE TABS */}
      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
        {reports.map((report) => (
          <motion.button
            key={report.id}
            whileHover={{ y: -5 }}
            onClick={() => fetchReport(report.id, report.name)}
            className={`bg-zinc-900 border rounded-2xl p-5 text-left hover:border-orange-500 transition ${
              selectedReportId === report.id ? "border-orange-500" : "border-zinc-800"
            }`}
          >
            <div className="text-orange-500 mb-4">{report.icon}</div>
            <p className="font-semibold">{report.name}</p>
            <span className="text-xs text-zinc-500">
              {selectedReportId === report.id ? "Currently viewing" : "View report"}
            </span>
          </motion.button>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* RESULT — always visible, updates in place */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <FileBarChart2 className="text-orange-500" />
          <h2 className="text-xl font-bold">{selectedReportName}</h2>
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
  const totalCompleted = metrics.reduce((sum, j) => sum + (j.tripsInPeriod?.completedTrips || 0), 0);
  const totalCancelled = metrics.reduce((sum, j) => sum + (j.tripsInPeriod?.cancelledTrips || 0), 0);

  const chartData = metrics.map((j) => {
    const total = j.tripsInPeriod?.totalTrips || 0;
    const completed = j.tripsInPeriod?.completedTrips || 0;
    const cancelled = j.tripsInPeriod?.cancelledTrips || 0;
    return {
      name: j.plateNumber,
      Completed: completed,
      Cancelled: cancelled,
      "In Progress": Math.max(total - completed - cancelled, 0)
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Jeepneys" value={data.totalJeepneysCount ?? 0} />
        <StatCard label="Trips In Period" value={totalTripsInPeriod} />
        <StatCard label="Completed Trips" value={totalCompleted} accent="text-emerald-400" />
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
              <Bar dataKey="Completed" stackId="a" fill="#34D399" />
              <Bar dataKey="Cancelled" stackId="a" fill="#EF4444" />
              <Bar dataKey="In Progress" stackId="a" fill="#71717A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Fleet Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800">
                <th className="px-5 py-3">Plate No.</th>
                <th className="px-5 py-3">Jeepney No.</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Capacity</th>
                <th className="px-5 py-3">Current Status</th>
                <th className="px-5 py-3">Total Trips</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-500 text-xs">
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
                    <td className="px-5 py-3 text-emerald-400">{j.tripsInPeriod?.completedTrips || 0}</td>
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
    Completed: r.completedTrips,
    Cancelled: r.cancelledTrips,
    "In Progress": Math.max(r.totalTrips - r.completedTrips - r.cancelledTrips, 0)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Routes" value={data.routesCount ?? 0} />
        <StatCard label="Total Trips" value={routes.reduce((s, r) => s + r.totalTrips, 0)} />
        <StatCard label="Passengers Carried" value={routes.reduce((s, r) => s + r.totalPassengers, 0)} />
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
              <Bar dataKey="Completed" stackId="a" fill="#34D399" />
              <Bar dataKey="Cancelled" stackId="a" fill="#EF4444" />
              <Bar dataKey="In Progress" stackId="a" fill="#71717A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Route Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800">
                <th className="px-5 py-3">Origin</th>
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Fare</th>
                <th className="px-5 py-3">Total Trips</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Cancelled</th>
                <th className="px-5 py-3">Passengers</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-zinc-500 text-xs">
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
                    <td className="px-5 py-3 text-emerald-400">{r.completedTrips}</td>
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
  const statusColor = { Scheduled: "#FBBF24", Departed: "#38BDF8", Arrived: "#34D399", Cancelled: "#EF4444" };
  const statusData = Object.entries(data.tripsByStatus || {}).map(([name, value]) => ({ name, value }));
  const hasStatusData = statusData.some((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Trips" value={data.totalTrips ?? 0} />
        <StatCard label="Completed Trips" value={data.completedTrips ?? 0} accent="text-emerald-400" />
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
                    <Cell key={entry.name} fill={statusColor[entry.name] || COLORS[i % COLORS.length]} />
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
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-950">
                  <th className="px-4 py-3">Trip Code</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Passengers</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-xs">
                      No trips found.
                    </td>
                  </tr>
                ) : (
                  trips.slice(0, 20).map((t) => (
                    <tr key={t._id} className="text-xs text-white border-b border-zinc-800 hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-mono">{t.tripCode}</td>
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
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-950">
              <th className="px-5 py-3">Trip Code</th>
              <th className="px-5 py-3">Route</th>
              <th className="px-5 py-3">Jeepney</th>
              <th className="px-5 py-3">Passengers</th>
              <th className="px-5 py-3">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-zinc-500 text-xs">
                  No passenger records found.
                </td>
              </tr>
            ) : (
              details.map((d) => (
                <tr key={d._id} className="text-xs text-white border-b border-zinc-800 hover:bg-zinc-900/50">
                  <td className="px-5 py-3 font-mono">{d.trip?.tripCode ?? "N/A"}</td>
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
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Estimated Revenue"
          value={`₱${(data.overallEstimatedRevenue ?? 0).toLocaleString()}`}
          accent="text-orange-400"
        />
        <StatCard label="Completed Trips" value={data.completedTripsCount ?? 0} />
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
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-950">
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {byRoute.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-zinc-500 text-xs">
                      No data.
                    </td>
                  </tr>
                ) : (
                  byRoute.map((r) => (
                    <tr key={r.routeId} className="text-xs text-white border-b border-zinc-800 hover:bg-zinc-900/50">
                      <td className="px-5 py-3">
                        {r.origin} - {r.destination}
                      </td>
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