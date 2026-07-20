import {
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

const formatTime12Hour = (time24) => {
  if (!time24) return '--';
  const [hourStr, minute] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
};

const ScheduleTable = ({
  schedules,
  onEdit,
  onDelete,
  onOverride,
  onReviewOverride,
  sortBy,
  sortOrder,
  onSort,
  isAdmin,
}) => {
  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;

    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  const getOverrideButtonLabel = (schedule) => {
    if (schedule.overrideDisputeReason) return "Resolve Dispute";
    if (schedule.overridePending) return "Revise Override";
    return "Admin Edit";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#09090B] border-b border-[#27272A]">
          <tr>
            <th
              onClick={() => onSort("scheduleCode")}
              className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white select-none"
            >
              Schedule Code
              <SortIcon field="scheduleCode" />
            </th>

            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">
              Route
            </th>

            <th
              onClick={() => onSort("departureTime")}
              className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white select-none"
            >
              Departure
              <SortIcon field="departureTime" />
            </th>

            <th
              onClick={() => onSort("expectedArrivalTime")}
              className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white select-none"
            >
              Estimated Arrival
              <SortIcon field="expectedArrivalTime" />
            </th>

            <th
              onClick={() => onSort("status")}
              className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white select-none"
            >
              Status
              <SortIcon field="status" />
            </th>

            <th className="px-5 py-4 text-center text-[11px] font-mono uppercase text-[#A1A1AA]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {schedules.map((schedule) => {
            const route = schedule.route;

            return (
              <tr
                key={schedule._id}
                className={`border-b border-[#27272A] transition-colors ${
                  schedule.overridePending
                    ? "bg-amber-500/5 hover:bg-amber-500/10"
                    : "hover:bg-[#18181B]"
                }`}
              >
                {/* Schedule Code */}
                <td className="px-5 py-4 font-semibold text-white text-sm">
                  {schedule.scheduleCode}
                </td>

                {/* Route */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-medium">
                      {route?.routeCode || "--"}
                    </span>

                    <span className="text-[#A1A1AA] text-[10px] mt-0.5">
                      {route?.origin} → {route?.destination}
                    </span>
                  </div>
                </td>

                {/* Departure */}
                <td className="px-5 py-4 text-white text-sm">
                  {formatTime12Hour(schedule.departureTime)}
                </td>

                {/* Estimated Arrival */}
                <td className="px-5 py-4 text-white text-sm">
                  {formatTime12Hour(schedule.expectedArrivalTime)}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span
                    className={`px-3 py-1 rounded-full border text-[11px] font-semibold ${
                      schedule.status === "Inactive"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {schedule.status || "Active"}
                  </span>

                  {schedule.overridePending && (
                    <button
                      onClick={() => onReviewOverride(schedule)}
                      className={`flex items-center gap-1 mt-1.5 text-[10px] font-semibold cursor-pointer hover:underline ${
                        schedule.overrideDisputeReason ? "text-red-400" : "text-amber-400"
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {schedule.overrideDisputeReason
                        ? "Disputed — Needs Admin Review"
                        : "Admin-Corrected — Needs Review"}
                    </button>
                  )}
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex justify-center gap-2">
                    {isAdmin ? (
                      <button
                        onClick={() => onOverride(schedule)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition text-xs font-semibold cursor-pointer ${
                          schedule.overrideDisputeReason
                            ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{getOverrideButtonLabel(schedule)}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(schedule)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition cursor-pointer text-xs font-semibold"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => onDelete(schedule)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition cursor-pointer text-xs font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;