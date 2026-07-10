import PassengerStatistic from '../models/PassengerStatistic.js';
import Trip from '../models/Trip.js';
import Jeepney from '../models/Jeepney.js';
import Route from '../models/Route.js';



/**
 * Create Passenger Statistic
 */
export const createPassengerStatistic = async (
  tripId,
  passengerCount
) => {

  const trip = await Trip.findById(tripId)
    .populate('jeepney')
    .populate('route');

  if (!trip) {
    throw new Error('Trip not found');
  }

  const jeepney = trip.jeepney;
  const route = trip.route;

  const occupancyRate =
    jeepney && jeepney.capacity
      ? Number(
          ((passengerCount / jeepney.capacity) * 100).toFixed(2)
        )
      : 0;

  const estimatedRevenue =
    route && route.estimatedFare
      ? passengerCount * route.estimatedFare
      : 0;

  let statistic = await PassengerStatistic.findOne({
    trip: tripId
  });

  if (statistic) {

    statistic.passengerCount = passengerCount;
    statistic.occupancyRate = occupancyRate;
    statistic.estimatedRevenue = estimatedRevenue;

    await statistic.save();

    return statistic;

  }

  statistic = await PassengerStatistic.create({

    trip: tripId,

    passengerCount,

    occupancyRate,

    estimatedRevenue

  });

  return statistic;

};



/**
 * Fetch Statistics
 */
export const fetchStatistics = async (filters = {}) => {

  const query = {};

  const statistics = await PassengerStatistic.find(query)

    .populate({

      path: 'trip',

      populate: [

        'route',

        'jeepney',

        'schedule'

      ]

    })

    .sort({

      createdAt: -1

    });

  return statistics;

};



/**
 * Compute Occupancy and Revenue
 */
export const computeOccupancyAndRevenue = async (

  passengerCount,

  jeepneyId,

  routeId

) => {

  const jeepney =
    await Jeepney.findById(

      jeepneyId

    );

  if (!jeepney) {

    throw new Error(

      'Jeepney not found'

    );

  }



  const route =
    await Route.findById(

      routeId

    );

  if (!route) {

    throw new Error(

      'Route not found'

    );

  }



  const occupancyRate =

    Number(

      (

        passengerCount /

        jeepney.capacity

      ) * 100

    )

    .toFixed(2);



  const estimatedRevenue =

    passengerCount *

    route.estimatedFare;



  return {

    passengerCount,

    capacity:

      jeepney.capacity,

    occupancyRate:

      Number(

        occupancyRate

      ),

    fare:

      route.estimatedFare,

    estimatedRevenue

  };

};



const passengerStatisticService = {

  createPassengerStatistic,

  fetchStatistics,

  computeOccupancyAndRevenue

};



export default passengerStatisticService;