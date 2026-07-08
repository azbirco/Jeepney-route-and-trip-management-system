import Route from '../models/Route.js';
import ActivityLog from '../models/ActivityLog.js';


// @desc    Create Route
// @route   POST /api/routes
// @access  Private
export const createRoute = async (req, res) => {

  try {

    const route = await Route.create(req.body);

    await ActivityLog.create({
      user: req.user?._id,
      action: 'Create Route',
      details: `Created route ${route.origin} - ${route.destination}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route
    });

  }

  catch (error) {

    if (error.code === 11000) {

      return res.status(400).json({
        success: false,
        message:
          'A route with this origin and destination already exists.'
      });

    }

    res.status(400).json({
      success: false,
      message: error.message
    });

  }

};



// @desc    Get Routes
// @route   GET /api/routes
// @access  Private
export const getRoutes = async (req, res) => {

  try {

    const { search, origin, destination } = req.query;

    const query = {};

    if (origin) {
      query.origin = origin;
    }

    if (destination) {
      query.destination = destination;
    }

    if (search) {

      query.$or = [

        {
          origin: {
            $regex: search,
            $options: 'i'
          }
        },

        {
          destination: {
            $regex: search,
            $options: 'i'
          }
        },

        {
          routeCode: {
            $regex: search,
            $options: 'i'
          }
        }

      ];

    }

    const routes = await Route.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({

      success: true,

      count: routes.length,

      data: routes

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


// @desc    Get Route by ID
// @route   GET /api/routes/:id
// @access  Private
export const getRouteById = async (req, res) => {

  try {

    const route = await Route.findById(
      req.params.id
    );

    if (!route) {

      return res.status(404).json({

        success: false,

        message: 'Route not found'

      });

    }

    res.status(200).json({

      success: true,

      data: route

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


// @desc    Update Route
// @route   PUT /api/routes/:id
// @access  Private
export const updateRoute = async (req, res) => {

  try {

    const route =
      await Route.findByIdAndUpdate(

        req.params.id,

        req.body,

        {
          new: true,
          runValidators: true
        }

      );

    if (!route) {

      return res.status(404).json({

        success: false,

        message: 'Route not found'

      });

    }

    await ActivityLog.create({

      user: req.user?._id,

      action: 'Update Route',

      details:
        `Updated route ${route.origin} - ${route.destination}`,

      ipAddress: req.ip

    });

    res.status(200).json({

      success: true,

      message: 'Route updated successfully',

      data: route

    });

  }

  catch (error) {

    if (error.code === 11000) {

      return res.status(400).json({

        success: false,

        message:
          'A route with this origin and destination already exists.'

      });

    }

    res.status(400).json({

      success: false,

      message: error.message

    });

  }

};


// @desc    Delete Route
// @route   DELETE /api/routes/:id
// @access  Private
export const deleteRoute = async (req, res) => {

  try {

    const route =
      await Route.findByIdAndDelete(
        req.params.id
      );

    if (!route) {

      return res.status(404).json({

        success: false,

        message: 'Route not found'

      });

    }

    await ActivityLog.create({

      user: req.user?._id,

      action: 'Delete Route',

      details:
        `Deleted route ${route.origin} - ${route.destination}`,

      ipAddress: req.ip

    });

    res.status(200).json({

      success: true,

      message: 'Route deleted successfully'

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};