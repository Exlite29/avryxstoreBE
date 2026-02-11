const { initializeDatabase } = require('./src/config/database');
const { generateAccessToken } = require('./src/middleware/auth');

async function test() {
  try {
    console.log('Testing database initialization...');
    const db = await initializeDatabase();
    console.log('Database initialized successfully!');

    // Test creating a user
    console.log('Testing user creation...');
    const result = await db.run(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?)`,
      ['test@example.com', 'hashed_password', 'Test User', 'admin']
    );
    console.log('User created successfully!', result);

    // Test retrieving user
    console.log('Testing user retrieval...');
    const user = await db.get(
      'SELECT id, email, full_name, role FROM users WHERE email = ?',
      ['test@example.com']
    );
    console.log('User retrieved successfully!', user);

    // Test JWT token generation
    console.log('Testing JWT token generation...');
    const token = generateAccessToken(user);
    console.log('Token generated successfully!', token.substring(0, 20) + '...');

    console.log('All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();