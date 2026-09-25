require("dotenv").config();
const { Client } = require("pg");

async function promote() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows: users } = await client.query(
    "SELECT id, email, role FROM users ORDER BY id"
  );
  console.log("Current users:", users);

  if (users.length > 0) {
    const lastUser = users[users.length - 1];
    await client.query("UPDATE users SET role = 'owner' WHERE id = $1", [
      lastUser.id,
    ]);
    console.log(`Successfully promoted ${lastUser.email} to owner!`);
  } else {
    console.log("No users found to promote.");
  }

  await client.end();
}

promote().catch(console.error);