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

  const SortHeader = ({ label, field }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-mono text-[#A1A1AA] uppercase hover:text-white transition-colors"
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#09090B] border-b border-[#27272A]">
          <tr>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Route Code" field="routeCode" />
            </th>

            <th className="px-4 py-3 text-left">
              <SortHeader label="Origin" field="origin" />
            </th>

            <th className="px-4 py-3 text-left">
              <SortHeader label="Destination" field="destination" />
            </th>

            <th className="px-4 py-3 text-left">
              <SortHeader label="Travel Time" field="estimatedTravelTime" />
            </th>

            <th className="px-4 py-3 text-left">
              <SortHeader label="Fare" field="estimatedFare" />
            </th>

            <th className="px-4 py-3 text-left">
              Status
            </th>

            {isAdmin && (
              <th className="px-4 py-3 text-left">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {routes.map((route) => (
            <tr
              key={route._id}
              className="border-b border-[#27272A] hover:bg-[#27272A]/20 transition-colors"
            >

              <td className="px-4 py-4 text-xs text-white font-semibold">
                {route.routeCode}
              </td>

              <td className="px-4 py-4 text-xs text-[#A1A1AA]">
                {route.origin}
              </td>

              <td className="px-4 py-4 text-xs text-[#A1A1AA]">
                {route.destination}
              </td>

              <td className="px-4 py-4 text-xs text-white">
                {route.estimatedTravelTime} mins
              </td>

              <td className="px-4 py-4 text-xs text-white">
                ₱{Number(route.estimatedFare).toFixed(2)}
              </td>

              <td className="px-4 py-4">
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold inline-block ${
                    route.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {route.status || "Active"}
                </span>
              </td>

              {isAdmin && (
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">

                    <button
                      onClick={() => onEdit(route)}
                      className="px-2 py-1 rounded-md border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors flex items-center gap-1 text-[10px] font-semibold"
                      title="Edit Route"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => onDelete(route)}
                      className="px-2 py-1 rounded-md border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                      title="Delete Route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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