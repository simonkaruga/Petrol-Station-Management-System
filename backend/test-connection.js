const { pool } = require('./config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('Current time from database:', result.rows[0].current_time);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    // Close the pool when done
    await pool.end();
    console.log('Database pool closed.');
  }
}

testConnection();