import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BarChart3,
  Coins,
  Activity,
  RefreshCw,
  AlertCircle,
  Bus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import api from '../services/api';


// Passengers page polls periodically (like the Sidebar badge) so newly
// recorded passenger statistics show up without requiring manual refresh
// or navigating away and back.
const POLL_INTERVAL_MS = 30000;


const Passengers = () => {

  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchPassengerStatistics = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const response = await api.get('/passenger-statistics');
      setStatistics(response.data.data || []);

    } catch (err) {
      console.error("Passenger statistics error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to load passenger statistics"
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);


  useEffect(() => {

    fetchPassengerStatistics();

    // Silent background poll — doesn't trigger the loading spinner,
    // just quietly refreshes so newly recorded stats appear on their own.
    const interval = setInterval(
      () => fetchPassengerStatistics({ silent: true }),
      POLL_INTERVAL_MS
    );

    return () => clearInterval(interval);

  }, [fetchPassengerStatistics]);


  // Ascending by Trip Code (TR-00001 → TR-00007), same fix applied to Trips.jsx
  const sortedStatistics = [...statistics].sort((a, b) => {
    const codeA = a.trip?.tripCode || '';
    const codeB = b.trip?.tripCode || '';
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });


  const totalPassengers =
    statistics.reduce((total, item) => total + (item.passengerCount || 0), 0);

  const totalRevenue =
    statistics.reduce((total, item) => total + (item.estimatedRevenue || 0), 0);

  const averageOccupancy =
    statistics.length > 0
      ? Math.round(
          statistics.reduce((total, item) => total + (item.occupancyRate || 0), 0)
          / statistics.length
        )
      : 0;


  // Aggregate per-route totals for the charts below
  const routeAggregates = statistics.reduce((acc, item) => {
    const route = item.trip?.route;
    const routeKey = route
      ? (route.routeCode || `${route.origin} → ${route.destination}`)
      : 'Unknown Route';

    if (!acc[routeKey]) {
      acc[routeKey] = { route: routeKey, passengers: 0, revenue: 0 };
    }

    acc[routeKey].passengers += item.passengerCount || 0;
    acc[routeKey].revenue += item.estimatedRevenue || 0;

    return acc;
  }, {});

  const routeChartData = Object.values(routeAggregates);


  return (

    <div className="space-y-8">

      {/* Header */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">

        <div className="flex items-center gap-3">

          <div className="p-3 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]">
            <Users className="w-6 h-6"/>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Passenger Statistics
            </h2>
            <p className="text-xs text-[#A1A1AA] font-mono">
              Monitor passenger load, occupancy, and revenue
            </p>
          </div>

        </div>

        <button
          onClick={() => fetchPassengerStatistics()}
          className="p-2 rounded-lg border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition"
          title="Refresh now"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
        </button>

      </div>


      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5"/>
          {error}
        </div>
      )}


      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <SummaryCard
          icon={<Users/>}
          title="Passengers Served"
          value={loading ? "..." : totalPassengers}
        />

        <SummaryCard
          icon={<Activity/>}
          title="Average Occupancy"
          value={loading ? "..." : `${averageOccupancy}%`}
        />

        <SummaryCard
          icon={<Coins/>}
          title="Estimated Revenue"
          value={loading ? "..." : `₱${totalRevenue.toLocaleString()}`}
        />

        <SummaryCard
          icon={<BarChart3/>}
          title="Recorded Trips"
          value={loading ? "..." : statistics.length}
        />

      </div>


      {/* Charts */}
      {!loading && routeChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">
              Total Passengers per Route
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A"/>
                  <XAxis
                    dataKey="route"
                    tick={{ fill: '#A1A1AA', fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: '#A1A1AA', fontSize: 10 }}/>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090B', border: '1px solid #27272A', fontSize: 12 }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="passengers" fill="#F97316" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">
              Estimated Revenue per Route
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A"/>
                  <XAxis
                    dataKey="route"
                    tick={{ fill: '#A1A1AA', fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: '#A1A1AA', fontSize: 10 }}/>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090B', border: '1px solid #27272A', fontSize: 12 }}
                    labelStyle={{ color: '#FFFFFF' }}
                    formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}


      {/* Passenger Records */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden">

        <div className="p-5 border-b border-[#27272A]">
          <h3 className="text-sm font-bold text-white">
            Passenger Load Records
          </h3>
        </div>

        {loading ? (

          <div className="h-52 flex items-center justify-center text-[#A1A1AA] text-xs">
            Retrieving passenger data...
          </div>

        ) : statistics.length === 0 ? (

          <div className="h-52 flex flex-col justify-center items-center text-[#A1A1AA]">
            <Bus className="w-8 h-8 mb-2"/>
            <p className="text-sm">No passenger statistics found</p>
          </div>

        ) : (

          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead>
                <tr className="text-[10px] uppercase font-mono text-[#A1A1AA] border-b border-[#27272A]">
                  <th className="px-5 py-4">Trip</th>
                  <th className="px-5 py-4">Route</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Jeepney</th>
                  <th className="px-5 py-4">Passenger Count</th>
                  <th className="px-5 py-4">Occupancy</th>
                  <th className="px-5 py-4">Revenue</th>
                </tr>
              </thead>

              <tbody>
                {sortedStatistics.map((item, index) => {

                  const route = item.trip?.route;
                  const capacity = item.trip?.jeepney?.capacity;

                  return (
                    <tr
                      key={item._id || index}
                      className="text-xs text-white border-b border-[#27272A] hover:bg-[#27272A]/30"
                    >
                      <td className="px-5 py-4 font-mono">
                        {item.trip?.tripCode || "---"}
                      </td>

                      <td className="px-5 py-4">
                        {route
                          ? (
                            <div className="flex flex-col">
                              <span className="text-white">{route.routeCode || "--"}</span>
                              <span className="text-[#A1A1AA] text-[10px]">
                                {route.origin} → {route.destination}
                              </span>
                            </div>
                          )
                          : "---"}
                      </td>

                      <td className="px-5 py-4">
                        {item.trip?.departureDate
                          ? new Date(item.trip.departureDate).toLocaleDateString()
                          : "--"}
                      </td>

                      <td className="px-5 py-4">
                        {item.trip?.jeepney?.jeepneyNumber || "---"}
                      </td>

                      <td className="px-5 py-4">
                        {item.passengerCount}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span>{item.occupancyRate}%</span>
                          {capacity != null && (
                            <span className="text-[#A1A1AA] text-[10px]">
                              {item.passengerCount}/{capacity} pax
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        ₱{item.estimatedRevenue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>

        )}

      </div>

    </div>

  );

};


const SummaryCard = ({ icon, title, value }) => (

  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#18181B] border border-[#27272A] rounded-xl p-4"
  >
    <div className="text-[#F97316] mb-3">
      {icon}
    </div>

    <p className="text-[10px] uppercase font-mono text-[#A1A1AA]">
      {title}
    </p>

    <h4 className="text-2xl font-black text-white mt-1">
      {value}
    </h4>
  </motion.div>

);


export default Passengers;