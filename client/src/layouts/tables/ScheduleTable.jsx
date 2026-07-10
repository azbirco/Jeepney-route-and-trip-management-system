import {
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
} from "lucide-react";

const ScheduleTable = ({
  schedules,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;

    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-[#09090B] border-b border-[#27272A]">
          <tr className="text-[#A1A1AA] uppercase tracking-wide">
            <th
              onClick={() => onSort("scheduleCode")}
              className="px-5 py-4 text-left cursor-pointer hover:text-white select-none"
            >
              Schedule Code
              <SortIcon field="scheduleCode" />
            </th>

            <th className="px-5 py-4 text-left">
              Route
            </th>

            <th
              onClick={() => onSort("departureTime")}
              className="px-5 py-4 text-left cursor-pointer hover:text-white select-none"
            >
              Departure
              <SortIcon field="departureTime" />
            </th>

            <th
              onClick={() => onSort("expectedArrivalTime")}
              className="px-5 py-4 text-left cursor-pointer hover:text-white select-none"
            >
              Estimated Arrival
              <SortIcon field="expectedArrivalTime" />
            </th>

            <th
              onClick={() => onSort("status")}
              className="px-5 py-4 text-left cursor-pointer hover:text-white select-none"
            >
              Status
              <SortIcon field="status" />
            </th>

            <th className="px-5 py-4 text-center">
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
                className="border-b border-[#27272A] hover:bg-[#1A1A1D] transition-colors"
              >
                {/* Schedule Code */}
                <td className="px-5 py-4 font-semibold text-white">
                  {schedule.scheduleCode}
                </td>

                {/* Route */}
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {route?.routeCode || "--"}
                    </span>

                    <span className="text-[#A1A1AA] text-[11px]">
                      {route?.origin} → {route?.destination}
                    </span>
                  </div>
                </td>

                {/* Departure */}
                <td className="px-5 py-4 text-white">
                  {schedule.departureTime || "--"}
                </td>

                {/* Estimated Arrival */}
                <td className="px-5 py-4 text-white">
                  {schedule.expectedArrivalTime || "--"}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      schedule.status === "Inactive"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {schedule.status || "Active"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(schedule)}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDelete(schedule)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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