import passengerStatisticService from '../services/passengerStatisticService.js';


// @desc    Create or update passenger statistics
// @route   POST /api/passenger-statistics
// @access  Private
export const createPassengerStatistic = async (req, res) => {
  try {

    const {
      trip,
      passengerCount
    } = req.body;


    const statistic =
      await passengerStatisticService.createPassengerStatistic(
        trip,
        passengerCount,
        req.user?.id,
        req.ip
      );


    res.status(201).json({
      success: true,
      message: 'Passenger statistics saved successfully',
      data: statistic
    });


  } catch (error) {

    res.status(
      error.message.includes('not found')
        ? 404
        : 400
    )
    .json({
      success: false,
      message: error.message
    });

  }
};


// @desc    Get Passenger Statistics
// @route   GET /api/passenger-statistics
// @access  Private
export const getStatistics = async (req, res) => {
  try {

    const {
      routeId,
      startDate,
      endDate
    } = req.query;


    const statistics =
      await passengerStatisticService.fetchStatistics({
        routeId,
        startDate,
        endDate
      });


    res.status(200).json({
      success: true,
      count: statistics.length,
      data: statistics
    });


  } catch (error) {

    res.status(500).json({
      success:false,
      message:'Error retrieving statistics',
      error:error.message
    });

  }
};


// @desc    Compute occupancy and revenue
// @route   POST /api/passenger-statistics/compute
// @access  Private
export const computeOccupancyAndRevenue = async (req,res)=>{
  try {

    const {
      passengerCount,
      jeepneyId,
      routeId
    } = req.body;


    const computations =
      await passengerStatisticService
      .computeOccupancyAndRevenue(
        passengerCount,
        jeepneyId,
        routeId
      );


    res.status(200).json({
      success:true,
      computations
    });


  } catch(error){

    res.status(
      error.message.includes('not found')
      ? 404
      : 400
    )
    .json({
      success:false,
      message:error.message
    });

  }
};