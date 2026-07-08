// @desc Restrict access based on user role
export const authorize = (...roles) => {

  return (req, res, next) => {

    if (!req.user) {

      return res.status(401).json({

        success: false,

        message: 'Not authenticated',

        error: 'Authentication required.'

      });

    }


    if (!roles.includes(req.user.role)) {

      return res.status(403).json({

        success: false,

        message: 'Access Denied',

        error: `Role '${req.user.role}' cannot access this resource.`

      });

    }


    next();

  };

};

export default authorize;