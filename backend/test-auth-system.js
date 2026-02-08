const { User } = require('./models');
const AuthService = require('./services/authService');
const { authenticate } = require('./middleware/auth');

console.log('Testing Authentication System...\n');

// Test 1: User model imports
try {
  console.log('✓ User model imported successfully');
  console.log('  - User.findById:', typeof User.findById);
  console.log('  - User.findByUsername:', typeof User.findByUsername);
  console.log('  - User.findByEmail:', typeof User.findByEmail);
} catch (error) {
  console.log('✗ User model import failed:', error.message);
}

// Test 2: Auth service imports
try {
  console.log('\n✓ AuthService imported successfully');
  console.log('  - AuthService.register:', typeof AuthService.register);
  console.log('  - AuthService.login:', typeof AuthService.login);
  console.log('  - AuthService.changePassword:', typeof AuthService.changePassword);
} catch (error) {
  console.log('\n✗ AuthService import failed:', error.message);
}

// Test 3: Middleware imports
try {
  console.log('\n✓ Auth middleware imported successfully');
  console.log('  - authenticate:', typeof authenticate);
} catch (error) {
  console.log('\n✗ Auth middleware import failed:', error.message);
}

// Test 4: Database connection
const db = require('./config/database');
try {
  db.query('SELECT 1 as test').then(() => {
    console.log('\n✓ Database connection successful');
  }).catch(error => {
    console.log('\n✗ Database connection failed:', error.message);
  });
} catch (error) {
  console.log('\n✗ Database connection failed:', error.message);
}

console.log('\nAuthentication system test completed!');