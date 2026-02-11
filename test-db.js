const { initializeDatabase } = require('./src/config/database');

async function test() {
  try {
    console.log('Initializing database...');
    const db = await initializeDatabase();
    console.log('Database initialized successfully!');

    // Test creating a table
    await db.exec(`CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)`);
    console.log('Test table created successfully!');

    // Test inserting data
    const result = await db.run('INSERT INTO test_table (name) VALUES (?)', ['test']);
    console.log('Test data inserted successfully!', result);

    // Test querying data
    const rows = await db.all('SELECT * FROM test_table');
    console.log('Test data retrieved successfully!', rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();