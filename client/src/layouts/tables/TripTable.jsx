import { 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  MapPin,
  Bus,
  Calendar,
  Clock,
  Users,
  UserCircle,
  PlayCircle,
  CheckCircle2,
  BellRing,
  AlertOctagon,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";

const formatTime12Hour = (time24) => {
  if (!time24) return '--';
  const [hourStr, minute] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
};

export default function TripTable({
  trips,
  onEdit,
  onDelete,
  onOverride,
  onReviewOverride,
  sortBy,
  sortOrder,
  onSort,
  isDriver,
  isAdmin,
  onStartTrip,
  onMarkArrived,
  onConfirmArrival
}) {


  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" 
      ? <ArrowUp className="w-3 h-3 inline ml-1" />
      : <ArrowDown className="w-3 h-3 inline ml-1" />;
  };


  const getStatusStyle = (status) => {
    switch(status){
      case "Scheduled":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Departed":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Arrived":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getOverrideButtonLabel = (trip) => {
    if (trip.overrideDisputeReason) return "Resolve Dispute";
    if (trip.overridePending) return "Revise Override";
    return "Override";
  };



  return (

    <div className="overflow-x-auto">

      <table className="w-full min-w-[1050px]">

        <thead className="bg-[#09090B] border-b border-[#27272A]">
          <tr>

            <th onClick={() => onSort("tripCode")} className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white">
              Trip Code
              <SortIcon field="tripCode"/>
            </th>

            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">Jeepney</th>

            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">Route</th>

            {!isDriver && (
              <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">Driver</th>
            )}

            <th onClick={() => onSort("departureDate")} className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white">
              Date
              <SortIcon field="departureDate"/>
            </th>

            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">Departure</th>

            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">Arrival</th>

            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">Passengers</th>

            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">Status</th>

            <th className="px-5 py-4 text-center text-[11px] font-mono uppercase text-[#A1A1AA]">Actions</th>

          </tr>
        </thead>

        <tbody>

        {trips.map((trip)=>{

          const isPendingConfirmation = trip.arrivalReported && trip.status !== "Arrived";
          const isNewOrCancelledForDriver = isDriver && !trip.driverNotified;

          const departureTime24 = trip.actualDepartureTime || trip.schedule?.departureTime || null;
          const arrivalTime24 = trip.actualArrivalTime || trip.schedule?.expectedArrivalTime || null;
          const departureDisplay = formatTime12Hour(departureTime24);
          const arrivalDisplay = formatTime12Hour(arrivalTime24);

          return (

          <tr
            key={trip._id}
            className={`
              border-b border-[#27272A] transition-colors
              ${
                isPendingConfirmation || isNewOrCancelledForDriver || trip.overridePending
                  ? "bg-amber-500/5 hover:bg-amber-500/10"
                  : "hover:bg-[#18181B]"
              }
            `}
          >

            <td className="px-5 py-4">
              <div className="font-semibold text-white text-sm">{trip.tripCode || "N/A"}</div>
              <div className="text-[10px] text-[#A1A1AA] mt-1">ID: {trip._id?.slice(-6)}</div>
            </td>

            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-[#F97316]"/>
                <div>
                  <div className="text-sm text-white">{trip.jeepney?.plateNumber || "N/A"}</div>
                  <div className="text-[10px] text-[#A1A1AA]">{trip.jeepney?.jeepneyNumber || ""}</div>
                </div>
              </div>
            </td>

            <td className="px-5 py-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F97316] mt-0.5"/>
                <div>
                  <div className="text-sm text-white">{trip.route?.origin || "Unknown"}</div>
                  <div className="text-xs text-[#A1A1AA]">→ {trip.route?.destination || "Unknown"}</div>
                </div>
              </div>
            </td>

            {!isDriver && (
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-[#A1A1AA]"/>
                  <span className="text-sm text-white">
                    {trip.driver?.fullName || trip.driver?.username || (
                      <span className="text-[#A1A1AA] text-xs italic">Unassigned</span>
                    )}
                  </span>
                </div>
              </td>
            )}

            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#A1A1AA]"/>
                <span className="text-sm text-white">
                  {trip.departureDate ? new Date(trip.departureDate).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </td>

            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A1A1AA]"/>
                <span className="text-sm text-white">{departureDisplay}</span>
              </div>
            </td>

            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A1A1AA]"/>
                <span className="text-sm text-white">{arrivalDisplay}</span>
              </div>
            </td>

            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#A1A1AA]"/>
                <span className="text-white text-sm">{trip.passengerCount || 0}</span>
              </div>
            </td>

            <td className="px-5 py-4">

              <span className={`px-3 py-1 rounded-full border text-[11px] font-semibold ${getStatusStyle(trip.status)}`}>
                {trip.status}
              </span>

              {isPendingConfirmation && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-400 font-semibold">
                  <BellRing className="w-3 h-3"/>
                  {isDriver ? "Pending Confirmation" : "Arrival Reported"}
                </div>
              )}

              {isNewOrCancelledForDriver && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-400 font-semibold">
                  {trip.status === "Cancelled" ? (
                    <>
                      <AlertOctagon className="w-3 h-3"/>
                      Trip Cancelled
                    </>
                  ) : (
                    <>
                      <BellRing className="w-3 h-3"/>
                      New Assignment
                    </>
                  )}
                </div>
              )}

              {!isDriver && trip.overridePending && (
                <button
                  onClick={() => onReviewOverride(trip)}
                  className={`flex items-center gap-1 mt-1.5 text-[10px] font-semibold cursor-pointer hover:underline ${
                    trip.overrideDisputeReason ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3"/>
                  {trip.overrideDisputeReason
                    ? "Disputed — Needs Admin Review"
                    : "Admin-Corrected — Needs Review"}
                </button>
              )}

            </td>

            <td className="px-5 py-4">
              <div className="flex justify-center gap-2">

                {isDriver ? (
                  <>
                    {trip.status === "Scheduled" && (
                      <button
                        onClick={() => onStartTrip(trip)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition text-xs font-semibold"
                        title="Start Trip"
                      >
                        <PlayCircle className="w-4 h-4"/>
                        Start Trip
                      </button>
                    )}

                    {trip.status === "Departed" && !trip.arrivalReported && (
                      <button
                        onClick={() => onMarkArrived(trip)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition text-xs font-semibold"
                        title="Mark as Arrived"
                      >
                        <CheckCircle2 className="w-4 h-4"/>
                        Mark Arrived
                      </button>
                    )}

                    {isPendingConfirmation && (
                      <span className="text-[10px] text-amber-400 italic font-semibold">Awaiting confirmation</span>
                    )}

                    {(trip.status === "Arrived" || trip.status === "Cancelled") && !isPendingConfirmation && (
                      <span className="text-[10px] text-[#A1A1AA] italic">No action available</span>
                    )}
                  </>
                ) : isPendingConfirmation ? (
                  <button
                    onClick={() => onConfirmArrival(trip)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition text-xs font-semibold"
                    title="Confirm Arrival"
                  >
                    <CheckCircle2 className="w-4 h-4"/>
                    Confirm Arrival
                  </button>
                ) : isAdmin ? (
                  <button
                    onClick={() => onOverride(trip)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition text-xs font-semibold cursor-pointer ${
                      trip.overrideDisputeReason
                        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4"/>
                    <span>{getOverrideButtonLabel(trip)}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onEdit(trip)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition text-xs font-semibold"
                      title="Edit Trip"
                    >
                      <Edit className="w-4 h-4"/>
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => onDelete(trip)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition text-xs font-semibold"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-4 h-4"/>
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

}