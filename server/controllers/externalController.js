import Trip from "../models/Trip.js";
import Jeepney from "../models/Jeepney.js";
import Route from "../models/Route.js";
import PassengerStatistic from "../models/PassengerStatistic.js";



// =====================================
// SUMMARY API
// GET /api/external/summary
// =====================================

export const getExternalSummary = async (req, res) => {

  try {


    const totalJeepneys =
      await Jeepney.countDocuments();



    const totalRoutes =
      await Route.countDocuments();



    const totalTrips =
      await Trip.countDocuments();



    const totalPassengers =
      await Trip.aggregate([

        {
          $group:{
            _id:null,
            total:{
              $sum:"$passengerCount"
            }
          }
        }

      ]);



    const totalRevenue =
      await Trip.aggregate([

        {
          $match:{
            status:"Arrived"
          }
        },

        {
          $group:{
            _id:null,
            total:{
              $sum:"$estimatedRevenue"
            }
          }
        }

      ]);



    const tripsByStatus =
      await Trip.aggregate([

        {
          $group:{

            _id:"$status",

            count:{
              $sum:1
            }

          }

        }

      ]);



    const occupancy =
      await PassengerStatistic.aggregate([

        {
          $group:{

            _id:null,

            average:{
              $avg:"$occupancyRate"
            }

          }

        }

      ]);



    const statusSummary = {

      Scheduled:0,

      Departed:0,

      Arrived:0,

      Cancelled:0

    };



    tripsByStatus.forEach(item=>{

      statusSummary[item._id] =
        item.count;

    });



    res.json({

      success:true,

      data:{


        totalJeepneys,


        totalRoutes,


        totalTrips,


        totalPassengers:
          totalPassengers[0]?.total || 0,


        totalEstimatedRevenue:
          totalRevenue[0]?.total || 0,


        averageOccupancyRate:
          Math.round(
            occupancy[0]?.average || 0
          ),


        tripsByStatus:
          statusSummary

      }

    });



  }

  catch(error){

    console.error(error);


    res.status(500).json({

      success:false,

      message:"Failed to generate summary"

    });

  }

};






// =====================================
// TRANSACTIONS API
// GET /api/external/transactions
// =====================================

export const getExternalTransactions = async (req,res)=>{


  try{


    const trips = await Trip.find()

      .populate(
        "route",
        "routeName origin destination fare"
      )

      .populate(
        "jeepney",
        "plateNumber jeepneyCode"
      )

      .sort({
        createdAt:-1
      })

      .limit(50)

      .lean();





    const transactions = trips.map(trip=>({


      _id:
        trip._id,


      type:
        "trip",


      tripCode:
        trip.tripCode,


      route:

        trip.route

        ?

        `${trip.route.origin} - ${trip.route.destination}`

        :

        null,



      jeepney:

        trip.jeepney

        ?

        trip.jeepney.plateNumber

        :

        null,



      passengerCount:
        trip.passengerCount,



      fare:

        trip.route

        ?

        trip.route.fare

        :

        null,



      amount:
        trip.estimatedRevenue,



      status:
        trip.status,



      timestamp:
        trip.createdAt


    }));





    res.json({

      success:true,

      data:transactions

    });



  }

  catch(error){


    console.error(error);



    res.status(500).json({

      success:false,

      message:"Failed to fetch transactions"

    });


  }


};