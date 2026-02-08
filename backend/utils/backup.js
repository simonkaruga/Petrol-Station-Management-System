const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { SystemBackup } = require('../models');

const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Perform database backup
async function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `wakaruku_backup_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wakaruku_petrol_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  };

  const command = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${filepath}"`;

  return new Promise((resolve, reject) => {
    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed:', error);
        await SystemBackup.create({
          backupFilename: filename,
          status: 'failed',
          errorMessage: error.message
        });
        reject(error);
        return;
      }

      // Get file size
      const stats = fs.statSync(filepath);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

      // Log successful backup
      await SystemBackup.create({
        backupFilename: filename,
        backupSizeMb: sizeMb,
        status: 'success'
      });

      console.log(`✅ Backup successful: ${filename} (${sizeMb} MB)`);
      
      // Clean old backups (keep last 30 days)
      await cleanOldBackups();
      
      resolve(filepath);
    });
  });
}

// Clean backups older than 30 days
async function cleanOldBackups() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const files = fs.readdirSync(BACKUP_DIR);
    
    files.forEach(file => {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filepath);
        console.log(`🗑️  Deleted old backup: ${file}`);
      }
    });

    // Also clean database records
    await SystemBackup.destroy({
      where: {
        backupDate: {
          [require('sequelize').Op.lt]: thirtyDaysAgo
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning old backups:', error);
  }
}

// Schedule daily backup at 3:00 AM
function scheduleBackups() {
  cron.schedule('0 3 * * *', async () => {
    console.log('🕒 Running scheduled backup at 3:00 AM...');
    try {
      await performBackup();
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  });
  
  console.log('✅ Backup scheduler initialized (daily at 3:00 AM)');
}

module.exports = {
  performBackup,
  scheduleBackups,
  cleanOldBackups
};
