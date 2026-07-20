import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

// Bawat report type may sariling table columns at stat lines.
// 'extra' ay yung top-level 'trips'/'details' array na hiwalay
// sa 'data' object (base sa structure ng reportController.js mo).
const REPORT_TABLE_CONFIG = {
  jeepneys: (data) => ({
    head: [[
      "Plate No.", "Jeepney No.", "Type", "Capacity",
      "Status", "Total", "Scheduled", "Departed", "Arrived", "Cancelled"
    ]],
    body: (data.jeepneyMetrics || []).map((j) => [
      j.plateNumber,
      j.jeepneyNumber,
      j.type,
      j.capacity,
      j.currentStatus || "N/A",
      j.tripsInPeriod?.totalTrips || 0,
      j.tripsInPeriod?.scheduledTrips || 0,
      j.tripsInPeriod?.departedTrips || 0,
      j.tripsInPeriod?.arrivedTrips || 0,
      j.tripsInPeriod?.cancelledTrips || 0
    ]),
    stats: [["Total Jeepneys", data.totalJeepneysCount ?? 0]]
  }),

  routes: (data) => ({
    head: [[
      "Origin", "Destination", "Fare", "Total",
      "Scheduled", "Departed", "Arrived", "Cancelled", "Passengers"
    ]],
    body: (data.routeMetrics || []).map((r) => [
      r.origin,
      r.destination,
      `P${r.estimatedFare}`,
      r.totalTrips,
      r.scheduledTrips || 0,
      r.departedTrips || 0,
      r.arrivedTrips,
      r.cancelledTrips,
      r.totalPassengers
    ]),
    stats: [["Total Routes", data.routesCount ?? 0]]
  }),

  "daily-trips": (data, extra) => ({
    head: [["Trip Code", "Date", "Route", "Status", "Passengers"]],
    body: (extra.trips || []).map((t) => [
      t.tripCode,
      formatDate(t.departureDate),
      t.route ? `${t.route.origin} - ${t.route.destination}` : "N/A",
      t.status,
      t.passengerCount ?? 0
    ]),
    stats: [
      ["Total Trips", data.totalTrips ?? 0],
      ["Arrived Trips", data.arrivedTrips ?? 0],
      ["Cancelled Trips", data.cancelledTrips ?? 0],
      ["Total Passengers", data.totalPassengers ?? 0]
    ]
  }),

  passengers: (data, extra) => ({
    head: [["Trip Code", "Date", "Route", "Jeepney", "Passengers", "Occupancy"]],
    body: (extra.details || []).map((d) => [
      d.trip?.tripCode ?? "N/A",
      formatDate(d.trip?.departureDate),
      d.trip?.route ? `${d.trip.route.origin} - ${d.trip.route.destination}` : "N/A",
      d.trip?.jeepney?.plateNumber ?? "N/A",
      d.passengerCount,
      d.occupancyRate ? `${d.occupancyRate}%` : "N/A"
    ]),
    stats: [
      ["Total Passengers", data.totalPassengers ?? 0],
      ["Average Occupancy", `${data.averageOccupancy ?? 0}%`],
      ["Peak Trip", data.peakRecord?.tripCode ?? "N/A"],
      ["Peak Passenger Count", data.peakRecord?.passengerCount ?? 0]
    ]
  }),

  revenue: (data) => ({
    head: [["Route", "Trips", "Passengers", "Revenue"]],
    body: (data.revenueByRoute || []).map((r) => [
      `${r.origin} - ${r.destination}`,
      r.tripsCount ?? 0,
      r.passengersCount ?? 0,
      `P${r.revenue.toLocaleString()}`
    ]),
    stats: [
      ["Estimated Revenue", `P${(data.overallEstimatedRevenue ?? 0).toLocaleString()}`],
      ["Arrived Trips", data.arrivedTripsCount ?? 0]
    ]
  })
};

export const exportReportToPDF = ({ reportId, reportName, reportData, periodLabel }) => {
  const buildConfig = REPORT_TABLE_CONFIG[reportId];

  if (!buildConfig || !reportData) return;

  const { head, body, stats } = buildConfig(reportData.data || {}, {
    trips: reportData.trips,
    details: reportData.details
  });

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text(`RouteOps.NV - ${reportName}`, 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Period: ${periodLabel}`, 14, 23);

  if (reportData.dateFrom && reportData.dateTo) {
    doc.text(
      `Range: ${formatDate(reportData.dateFrom)} - ${formatDate(reportData.dateTo)}`,
      14,
      28
    );
  }

  doc.text(`Generated: ${new Date().toLocaleString("en-PH")}`, 14, 33);

  let statY = 40;
  doc.setTextColor(0);

  stats.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, statY);
    statY += 5;
  });

  autoTable(doc, {
    head,
    body,
    startY: statY + 3,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [249, 115, 22] } // orange-500, tugma sa theme mo
  });

  const fileName = `${reportId}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};