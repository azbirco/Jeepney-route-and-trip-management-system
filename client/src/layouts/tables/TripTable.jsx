import { 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  MapPin,
  Bus,
  Clock,
  Users
} from "lucide-react";


export default function TripTable({
  trips,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort
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



  return (

    <div className="overflow-x-auto">


      <table className="w-full min-w-[900px]">


        <thead className="bg-[#09090B] border-b border-[#27272A]">


          <tr>


            <th
              onClick={() => onSort("tripCode")}
              className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white"
            >
              Trip Code
              <SortIcon field="tripCode"/>
            </th>



            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">
              Jeepney
            </th>



            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">
              Route
            </th>



            <th
              onClick={() => onSort("departureDate")}
              className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA] cursor-pointer hover:text-white"
            >
              Departure
              <SortIcon field="departureDate"/>
            </th>



            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">
              Passengers
            </th>



            <th className="px-5 py-4 text-left text-[11px] font-mono uppercase text-[#A1A1AA]">
              Status
            </th>



            <th className="px-5 py-4 text-center text-[11px] font-mono uppercase text-[#A1A1AA]">
              Actions
            </th>



          </tr>


        </thead>




        <tbody>



        {trips.map((trip)=>(


          <tr
            key={trip._id}
            className="border-b border-[#27272A] hover:bg-[#18181B] transition-colors"
          >



            {/* Trip Code */}
            <td className="px-5 py-4">


              <div className="font-semibold text-white text-sm">
                {trip.tripCode || "N/A"}
              </div>


              <div className="text-[10px] text-[#A1A1AA] mt-1">
                ID: {trip._id?.slice(-6)}
              </div>


            </td>





            {/* Jeepney */}
            <td className="px-5 py-4">


              <div className="flex items-center gap-2">


                <Bus className="w-4 h-4 text-[#F97316]"/>


                <div>

                  <div className="text-sm text-white">
                    {trip.jeepney?.plateNumber || "N/A"}
                  </div>


                  <div className="text-[10px] text-[#A1A1AA]">
                    {trip.jeepney?.jeepneyNumber || ""}
                  </div>


                </div>


              </div>


            </td>






            {/* Route */}
            <td className="px-5 py-4">


              <div className="flex items-start gap-2">


                <MapPin className="w-4 h-4 text-[#F97316] mt-0.5"/>


                <div>


                  <div className="text-sm text-white">
                    {trip.route?.origin || "Unknown"}
                  </div>


                  <div className="text-xs text-[#A1A1AA]">
                    →
                    {" "}
                    {trip.route?.destination || "Unknown"}
                  </div>


                </div>


              </div>


            </td>







            {/* Departure */}
            <td className="px-5 py-4">


              <div className="flex items-center gap-2">


                <Clock className="w-4 h-4 text-[#A1A1AA]"/>


                <div>


                  <div className="text-sm text-white">

                    {
                      trip.departureDate
                      ?
                      new Date(trip.departureDate)
                      .toLocaleDateString()
                      :
                      "N/A"
                    }

                  </div>



                  <div className="text-xs text-[#A1A1AA]">

                    {trip.schedule?.departureTime || "--:--"}

                  </div>


                </div>


              </div>


            </td>






            {/* Passenger Count */}
            <td className="px-5 py-4">


              <div className="flex items-center gap-2">


                <Users className="w-4 h-4 text-[#A1A1AA]"/>


                <span className="text-white text-sm">
                  {trip.passengerCount || 0}
                </span>


              </div>


            </td>






            {/* Status */}
            <td className="px-5 py-4">


              <span
                className={`
                  px-3 py-1 
                  rounded-full 
                  border 
                  text-[11px]
                  font-semibold
                  ${getStatusStyle(trip.status)}
                `}
              >

                {trip.status}

              </span>


            </td>







            {/* Actions */}
            <td className="px-5 py-4">


              <div className="flex justify-center gap-2">



                <button
                  onClick={() => onEdit(trip)}
                  className="
                    p-2
                    rounded-lg
                    bg-blue-500/10
                    border
                    border-blue-500/20
                    text-blue-400
                    hover:bg-blue-500/20
                    transition
                  "
                  title="Edit Trip"
                >

                  <Edit className="w-4 h-4"/>

                </button>





                <button
                  onClick={() => onDelete(trip)}
                  className="
                    p-2
                    rounded-lg
                    bg-red-500/10
                    border
                    border-red-500/20
                    text-red-400
                    hover:bg-red-500/20
                    transition
                  "
                  title="Delete Trip"
                >

                  <Trash2 className="w-4 h-4"/>

                </button>



              </div>


            </td>



          </tr>



        ))}



        </tbody>



      </table>


    </div>

  );

}