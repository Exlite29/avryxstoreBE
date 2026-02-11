const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function promote() {
  const db = await open({
    filename: path.join(__dirname, 'src', 'sari_sari_store.db'),
    driver: sqlite3.Database
  });

  const users = await db.all("SELECT id, email, role FROM users");
  console.log("Current users:", users);

  if (users.length > 0) {
    const lastUser = users[users.length - 1];
    await db.run("UPDATE users SET role = 'owner' WHERE id = ?", [lastUser.id]);
    console.log(`Successfully promoted ${lastUser.email} to owner!`);
  } else {
    console.log("No users found to promote.");
  }
}

promote().catch(console.error);
