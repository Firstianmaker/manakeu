// middleware/roleMiddleware.js
const isAdmin = (req, res, next) => {
  if (!req.user) {
      return res.status(401).json({ 
          status: 'error',
          message: 'Unauthorized - No user data' 
      });
  }

  if (req.user.Role !== 'Admin') {
      return res.status(403).json({ 
          status: 'error',
          message: 'Forbidden - Admin access required' 
      });
  }

  next();
};

module.exports = { isAdmin };