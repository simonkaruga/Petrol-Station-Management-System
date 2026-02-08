const nodemailer = require('nodemailer');
const SecurityUtils = require('./security');

/**
 * Notification utility for security events and user communications
 */
class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  /**
   * Send security alert email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {object} details - Security event details
   */
  async sendSecurityAlert(to, subject, details) {
    if (!this.transporter) {
      console.warn('Email transporter not configured, skipping security alert');
      return;
    }

    const html = this.generateSecurityAlertHTML(subject, details);
    const text = this.generateSecurityAlertText(subject, details);

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Wakaruku Security" <security@wakaruku.com>',
        to,
        subject,
        text,
        html
      });

      console.log(`Security alert sent to ${to}`);
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  /**
   * Send login notification
   * @param {string} email - User email
   * @param {object} loginDetails - Login attempt details
   */
  async sendLoginNotification(email, loginDetails) {
    const subject = 'New Login to Your Wakaruku Account';
    const details = {
      type: 'login_notification',
      timestamp: new Date().toISOString(),
      ...loginDetails
    };

    await this.sendSecurityAlert(email, subject, details);
  }

  /**
   * Send suspicious activity alert
   * @param {string} email - User email
   * @param {object} activityDetails - Suspicious activity details
   */
  async sendSuspiciousActivityAlert(email, activityDetails) {
    const subject = 'Suspicious Activity Detected on Your Account';
    const details = {
      type: 'suspicious_activity',
      timestamp: new Date().toISOString(),
      ...activityDetails
    };

    await this.sendSecurityAlert(email, subject, details);
  }

  /**
   * Send 2FA setup confirmation
   * @param {string} email - User email
   * @param {object} setupDetails - 2FA setup details
   */
  async send2FASetupConfirmation(email, setupDetails) {
    const subject = 'Two-Factor Authentication Enabled';
    const details = {
      type: '2fa_enabled',
      timestamp: new Date().toISOString(),
      ...setupDetails
    };

    await this.sendSecurityAlert(email, subject, details);
  }

  /**
   * Send password change confirmation
   * @param {string} email - User email
   * @param {object} changeDetails - Password change details
   */
  async sendPasswordChangeConfirmation(email, changeDetails) {
    const subject = 'Password Changed Successfully';
    const details = {
      type: 'password_changed',
      timestamp: new Date().toISOString(),
      ...changeDetails
    };

    await this.sendSecurityAlert(email, subject, details);
  }

  /**
   * Send account lockout notification
   * @param {string} email - User email
   * @param {object} lockoutDetails - Account lockout details
   */
  async sendAccountLockoutNotification(email, lockoutDetails) {
    const subject = 'Account Temporarily Locked';
    const details = {
      type: 'account_locked',
      timestamp: new Date().toISOString(),
      ...lockoutDetails
    };

    await this.sendSecurityAlert(email, subject, details);
  }

  /**
   * Send backup code usage notification
   * @param {string} email - User email
   * @param {object} backupCodeDetails - Backup code usage details
   */
  async sendBackupCodeUsageNotification(email, backupCodeDetails) {
    const subject = 'Backup Code Used for Authentication';
    const details = {
      type: 'backup_code_used',
      timestamp: new Date().toISOString(),
      ...backupCodeDetails
    };

    await this.sendSecurityAlert(email, subject, details);
  }

  /**
   * Generate HTML email template for security alerts
   * @param {string} subject - Email subject
   * @param {object} details - Security event details
   * @returns {string} - HTML email content
   */
  generateSecurityAlertHTML(subject, details) {
    const timestamp = new Date(details.timestamp).toLocaleString();
    const deviceInfo = details.deviceInfo || {};
    const ip = details.ip || 'Unknown';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; }
          .content { padding: 20px; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
          .warning { color: #dc3545; font-weight: bold; }
          .info { color: #17a2b8; font-weight: bold; }
          ul { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔒 Security Alert</h2>
            <p class="info">${subject}</p>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            
            <p>We detected a security event on your Wakaruku account:</p>
            
            <div class="details">
              <h3>Event Details:</h3>
              <ul>
                <li><strong>Event Type:</strong> ${details.type || 'Security Alert'}</li>
                <li><strong>Time:</strong> ${timestamp}</li>
                <li><strong>IP Address:</strong> ${ip}</li>
                <li><strong>Device:</strong> ${deviceInfo.userAgent || 'Unknown'}</li>
              </ul>
            </div>
            
            ${this.getEventSpecificContent(details)}
            
            <p>If this was you, no action is needed. If you don't recognize this activity, please:</p>
            
            <ul>
              <li>Change your password immediately</li>
              <li>Review your account activity</li>
              <li>Contact support if needed</li>
            </ul>
            
            <p>For your security, we recommend:</p>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication</li>
              <li>Regularly review account activity</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated security notification from Wakaruku Petrol Station Management System.</p>
            <p>If you need assistance, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text email template for security alerts
   * @param {string} subject - Email subject
   * @param {object} details - Security event details
   * @returns {string} - Text email content
   */
  generateSecurityAlertText(subject, details) {
    const timestamp = new Date(details.timestamp).toLocaleString();
    const deviceInfo = details.deviceInfo || {};
    const ip = details.ip || 'Unknown';

    let content = `
SECURITY ALERT - ${subject}

Hello,

We detected a security event on your Wakaruku account:

Event Details:
- Event Type: ${details.type || 'Security Alert'}
- Time: ${timestamp}
- IP Address: ${ip}
- Device: ${deviceInfo.userAgent || 'Unknown'}

${this.getEventSpecificTextContent(details)}

If this was you, no action is needed. If you don't recognize this activity, please:

- Change your password immediately
- Review your account activity
- Contact support if needed

For your security, we recommend:
- Use a strong, unique password
- Enable two-factor authentication
- Regularly review account activity

This is an automated security notification from Wakaruku Petrol Station Management System.
If you need assistance, please contact our support team.
    `;

    return content.trim();
  }

  /**
   * Get event-specific HTML content
   * @param {object} details - Security event details
   * @returns {string} - Event-specific content
   */
  getEventSpecificContent(details) {
    switch (details.type) {
      case 'login_notification':
        return `
          <div class="details">
            <p class="info">A new login was detected on your account. If this wasn't you, please secure your account immediately.</p>
          </div>
        `;
      
      case 'suspicious_activity':
        return `
          <div class="details">
            <p class="warning">Suspicious activity was detected on your account. This may indicate unauthorized access attempts.</p>
            <p>Please review the activity and take appropriate action to secure your account.</p>
          </div>
        `;
      
      case '2fa_enabled':
        return `
          <div class="details">
            <p class="info">Two-factor authentication has been successfully enabled on your account.</p>
            <p>Make sure to store your backup codes in a safe place in case you lose access to your authenticator device.</p>
          </div>
        `;
      
      case 'password_changed':
        return `
          <div class="details">
            <p class="info">Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
          </div>
        `;
      
      case 'account_locked':
        return `
          <div class="details">
            <p class="warning">Your account has been temporarily locked due to multiple failed login attempts.</p>
            <p>The account will be automatically unlocked after 30 minutes, or you can contact support to unlock it immediately.</p>
          </div>
        `;
      
      case 'backup_code_used':
        return `
          <div class="details">
            <p class="info">A backup code was used to access your account.</p>
            <p>Remaining backup codes: ${details.remainingCodes || 'Unknown'}</p>
            <p>Consider regenerating your backup codes for security.</p>
          </div>
        `;
      
      default:
        return `
          <div class="details">
            <p class="warning">Please review this security event and take appropriate action if needed.</p>
          </div>
        `;
    }
  }

  /**
   * Get event-specific text content
   * @param {object} details - Security event details
   * @returns {string} - Event-specific content
   */
  getEventSpecificTextContent(details) {
    switch (details.type) {
      case 'login_notification':
        return 'A new login was detected on your account. If this wasn\'t you, please secure your account immediately.';
      
      case 'suspicious_activity':
        return 'Suspicious activity was detected on your account. This may indicate unauthorized access attempts. Please review the activity and take appropriate action to secure your account.';
      
      case '2fa_enabled':
        return 'Two-factor authentication has been successfully enabled on your account. Make sure to store your backup codes in a safe place in case you lose access to your authenticator device.';
      
      case 'password_changed':
        return 'Your password has been successfully changed. If you didn\'t make this change, please contact support immediately.';
      
      case 'account_locked':
        return 'Your account has been temporarily locked due to multiple failed login attempts. The account will be automatically unlocked after 30 minutes, or you can contact support to unlock it immediately.';
      
      case 'backup_code_used':
        return `A backup code was used to access your account. Remaining backup codes: ${details.remainingCodes || 'Unknown'}. Consider regenerating your backup codes for security.`;
      
      default:
        return 'Please review this security event and take appropriate action if needed.';
    }
  }

  /**
   * Log security events to console (fallback when email is not configured)
   * @param {string} type - Event type
   * @param {object} details - Event details
   */
  logSecurityEvent(type, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'security_event',
      eventType: type,
      details: {
        ...details,
        source: 'notification_service'
      }
    };

    console.log('SECURITY EVENT:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Send push notification (placeholder for future implementation)
   * @param {string} userId - User ID
   * @param {string} message - Notification message
   */
  async sendPushNotification(userId, message) {
    // Placeholder for push notification implementation
    // Would integrate with Firebase Cloud Messaging or similar service
    console.log(`Push notification to user ${userId}: ${message}`);
  }

  /**
   * Send SMS notification (placeholder for future implementation)
   * @param {string} phoneNumber - Phone number
   * @param {string} message - SMS message
   */
  async sendSMSNotification(phoneNumber, message) {
    // Placeholder for SMS notification implementation
    // Would integrate with Twilio or similar service
    console.log(`SMS to ${phoneNumber}: ${message}`);
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;