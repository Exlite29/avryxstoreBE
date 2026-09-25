require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const users = await client.query(
    "SELECT id FROM users WHERE email LIKE 'smoke_%@test.com' OR email LIKE 'smoke%_%@test.com'"
  );
  const userIds = users.rows.map((r) => r.id);
  const products = await client.query(
    "SELECT id FROM products WHERE name LIKE 'Smoke Test%'"
  );
  const productIds = products.rows.map((r) => r.id);
  const sales = await client.query(
    `SELECT id FROM sales WHERE cashier_id = ANY($1)`,
    [userIds.length ? userIds : [0]]
  );
  const saleIds = sales.rows.map((r) => r.id);

  if (userIds.length)
    await client.query(`DELETE FROM notifications WHERE user_id = ANY($1)`, [
      userIds,
    ]);
  if (saleIds.length)
    await client.query(`DELETE FROM sales_items WHERE sale_id = ANY($1)`, [
      saleIds,
    ]);
  if (saleIds.length) await client.query(`DELETE FROM sales WHERE id = ANY($1)`, [saleIds]);
  if (userIds.length) {
    await client.query(`DELETE FROM product_scans WHERE scanned_by = ANY($1)`, [
      userIds,
    ]);
    await client.query(`DELETE FROM transactions WHERE user_id = ANY($1)`, [
      userIds,
    ]);
  }
  if (productIds.length) {
    await client.query(`DELETE FROM inventory WHERE product_id = ANY($1)`, [
      productIds,
    ]);
    await client.query(`DELETE FROM barcodes WHERE product_id = ANY($1)`, [
      productIds,
    ]);
    await client.query(`DELETE FROM products WHERE id = ANY($1)`, [productIds]);
  }
  if (userIds.length) await client.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);

  console.log(
    `Cleaned: ${userIds.length} users, ${productIds.length} products, ${saleIds.length} sales`
  );
  await client.end();
})().catch((e) => {
  console.error("CLEANUP FAILED:", e.message);
  process.exit(1);
});