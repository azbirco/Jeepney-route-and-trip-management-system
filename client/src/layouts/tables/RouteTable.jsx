import { Edit, Trash2, ArrowUpDown } from "lucide-react";

const RouteTable = ({
  routes,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  isAdmin
}) => {

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc"
      ? <ArrowUpDown className="w-3 h-3 inline ml-1" />
      : <ArrowUpDown className="w-3 h-3 inline ml-1 rotate-180" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#09090B] border-b border-[#27272A]">
          <tr>
            <th onClick={() => onSort("routeCode")} className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white">
              Route Code
              <SortIcon field="routeCode" />
            </th>

            <th onClick={() => onSort("origin")} className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white">
              Origin
              <SortIcon field="origin" />
            </th>

            <th onClick={() => onSort("destination")} className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white">
              Destination
              <SortIcon field="destination" />
            </th>

            <th onClick={() => onSort("estimatedTravelTime")} className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white">
              Travel Time
              <SortIcon field="estimatedTravelTime" />
            </th>

            <th onClick={() => onSort("estimatedFare")} className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white">
              Fare
              <SortIcon field="estimatedFare" />
            </th>

            <th onClick={() => onSort("status")} className="px-5 py-4 text-center text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white">
              Status
              <SortIcon field="status" />
            </th>

            {isAdmin && (
              <th className="px-5 py-4 text-center text-[11px] font-mono uppercase text-[#A1A1AA]">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {routes.map((route) => (
            <tr
              key={route._id}
              className="border-b border-[#27272A] hover:bg-[#18181B] transition-colors"
            >

              <td className="px-5 py-4 font-semibold text-white text-sm">
                {route.routeCode}
              </td>

              <td className="px-5 py-4 text-sm text-white">
                {route.origin}
              </td>

              <td className="px-5 py-4 text-sm text-white">
                {route.destination}
              </td>

              <td className="px-5 py-4 text-sm text-white">
                {route.estimatedTravelTime} mins
              </td>

              <td className="px-5 py-4 text-sm text-white">
                ₱{Number(route.estimatedFare).toFixed(2)}
              </td>

              <td className="px-5 py-4 text-center">
                <span
                  className={`px-3 py-1 rounded-full border text-[11px] font-semibold inline-block ${
                    route.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {route.status || "Active"}
                </span>
              </td>

              {isAdmin && (
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">

                    <button
                      onClick={() => onEdit(route)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition text-xs font-semibold"
                      title="Edit Route"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => onDelete(route)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition text-xs font-semibold"
                      title="Delete Route"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>

                  </div>
                </td>
              )}

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RouteTable;