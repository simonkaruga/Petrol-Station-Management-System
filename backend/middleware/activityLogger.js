const db = require('../config/database');

// Log activity
async function logActivity(userId, action, tableAffected = null, recordId = null, details = null, ipAddress = null) {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, action, table_affected, record_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        userId,
        action,
        tableAffected,
        recordId,
        details ? JSON.stringify(details) : null,
        ipAddress
      ]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Middleware to log actions
function activityLogger(action, tableAffected = null) {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.userId;
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        let recordId = null;
        let details = null;
        
        try {
          const responseData = JSON.parse(data);
          if (responseData.data?.user?.id) {
            recordId = responseData.data.user.id;
          } else if (responseData.data?.id) {
            recordId = responseData.data.id;
          }
          details = {
            method: req.method,
            path: req.path,
            body: req.body
          };
        } catch (e) {
          // Ignore parse errors
        }
        
        if (userId) {
          logActivity(userId, action, tableAffected, recordId, details, ipAddress);
        }
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  logActivity,
  activityLogger
};
