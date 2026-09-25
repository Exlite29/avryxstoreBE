const BASE = "http://localhost:3000/api/v1";

let token = null;
let userId = null;
let productId = null;
let saleId = null;
let email = `smoke_${Date.now()}_${Math.floor(Math.random() * 999)}@test.com`;
const password = "Test1234!";

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};

async function req(method, path, body, auth = true, raw = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = raw ? text : null;
  }
  return { status: res.status, data };
}

async function main() {
  // 1. Register
  try {
    const r = await req("POST", "/auth/register", {
      email,
      password,
      full_name: "Smoke Tester",
    }, false);
    record("POST /auth/register", r.status === 201, `status=${r.status}`);
  } catch (e) {
    record("POST /auth/register", false, e.message);
  }

  // 2. Login
  let login = {};
  try {
    login = await req("POST", "/auth/login", { email, password }, false);
    record("POST /auth/login", login.status === 200 && !!login.data?.data?.accessToken, `status=${login.status}`);
    token = login.data?.data?.accessToken;
    userId = login.data?.data?.user?.id;
    record("Login returned role", login.data?.data?.user?.role === "owner", `role=${login.data?.data?.user?.role}`);
  } catch (e) {
    record("POST /auth/login", false, e.message);
  }

  if (!token) {
    console.log("\nAborting: no auth token.");
    process.exit(1);
  }

  // 3. Profile
  let r = await req("GET", "/auth/profile");
  record("GET /auth/profile", r.status === 200, `status=${r.status}`);

  // 4. Products
  r = await req("POST", "/products", {
    name: "Smoke Test Cola",
    barcode: "4801234567890",
    category: "Beverages",
    unit_price: 45.5,
    wholesale_price: 40,
    stock_quantity: 20,
    low_stock_threshold: 5,
  });
  record("POST /products", r.status === 201, `status=${r.status} msg=${r.data?.message || r.data?.error}`);
  productId = r.data?.data?.id;

  r = await req("GET", "/products");
  record("GET /products", r.status === 200 && Array.isArray(r.data?.data), `status=${r.status} total=${r.data?.pagination?.total}`);

  r = await req("GET", "/products/categories");
  record("GET /products/categories", r.status === 200, `status=${r.status}`);

  r = await req("GET", "/products/low-stock");
  record("GET /products/low-stock", r.status === 200, `status=${r.status}`);

  r = await req("GET", "/products/barcode/4801234567890");
  record("GET /products/barcode/:code", r.status === 200, `status=${r.status}`);

  r = await req("GET", `/products/${productId}`);
  record("GET /products/:id", r.status === 200, `status=${r.status}`);

  // 5. Inventory
  r = await req("POST", `/inventory/product/${productId}/add`, { quantity: 10 });
  record("POST /inventory add", r.status === 201, `status=${r.status} msg=${r.data?.message || r.data?.error}`);

  r = await req("GET", "/inventory");
  record("GET /inventory", r.status === 200, `status=${r.status}`);

  r = await req("GET", "/inventory/valuation");
  record("GET /inventory/valuation", r.status === 200, `status=${r.status}`);

  r = await req("GET", `/inventory/product/${productId}`);
  record("GET /inventory/product/:id", r.status === 200, `status=${r.status}`);

  // 6. Sales
  r = await req("POST", "/sales", {
    items: [{ product_id: productId, quantity: 2 }],
    payment_method: "cash",
    amount_paid: 200,
  });
  record("POST /sales", r.status === 201, `status=${r.status} msg=${r.data?.message || r.data?.error}`);
  saleId = r.data?.data?.id;

  r = await req("GET", "/sales");
  record("GET /sales", r.status === 200, `status=${r.status}`);

  r = await req("GET", "/sales/daily-summary");
  record("GET /sales/daily-summary", r.status === 200, `status=${r.status}`);

  if (saleId) {
    r = await req("GET", `/sales/${saleId}`);
    record("GET /sales/:id", r.status === 200, `status=${r.status}`);

    r = await req("GET", `/sales/${saleId}/receipt`);
    record("GET /sales/:id/receipt", r.status === 200, `status=${r.status}`);

    r = await req("POST", `/sales/${saleId}/cancel`, { reason: "smoke test" });
    record("POST /sales/:id/cancel", r.status === 200, `status=${r.status} msg=${r.data?.message || r.data?.error}`);
  }

  // 7. Reports
  r = await req("GET", "/reports/sales");
  record("GET /reports/sales", r.status === 200, `status=${r.status}`);

  r = await req("GET", "/reports/sales/top-products");
  record("GET /reports/sales/top-products", r.status === 200, `status=${r.status}`);

  r = await req("GET", "/reports/sales/daily");
  record("GET /reports/sales/daily", r.status === 200, `status=${r.status}`);

  r = await req("GET", "/reports/inventory");
  record("GET /reports/inventory", r.status === 200, `status=${r.status}`);

  r = await req("GET", "/reports/scanner/metrics");
  record("GET /reports/scanner/metrics", r.status === 200, `status=${r.status}`);

  // 8. Scanner
  r = await req("POST", "/scanner/barcode", { barcode: "4801234567890" });
  record("POST /scanner/barcode", r.status === 200, `status=${r.status} msg=${r.data?.message || r.data?.error}`);

  r = await req("GET", "/scanner/history");
  record("GET /scanner/history", r.status === 200, `status=${r.status}`);

  // 9. Auth flows
  r = await req("PUT", "/auth/profile", { fullName: "Smoke Tester Updated" });
  record("PUT /auth/profile", r.status === 200, `status=${r.status}`);

  r = await req("POST", "/auth/change-password", {
    currentPassword: password,
    newPassword: "NewPass1234!",
  });
  record("POST /auth/change-password", r.status === 200, `status=${r.status} msg=${r.data?.message || r.data?.error}`);
  if (r.status > 399) console.log("   change-password body:", JSON.stringify(r.data));

  // 10. Guard rails
  r = await req("GET", "/products", undefined, false);
  record("No-token GET /products -> 401", r.status === 401, `status=${r.status}`);

  r = await req("GET", "/does-not-exist");
  record("Unknown endpoint -> 404", r.status === 404, `status=${r.status}`);

  // 11. Edge cases / error paths
  r = await req("POST", "/auth/register", {
    email, password, full_name: "Smoke Tester"
  }, false);
  record("Duplicate register -> 409", r.status === 409, `status=${r.status}`);

  r = await req("POST", "/auth/login", { email, password: "WrongPass1!" }, false);
  record("Wrong password -> 401", r.status === 401, `status=${r.status}`);

  // Partial product update (image_urls omitted) — regression for undefined param bug
  if (productId) {
    r = await req("PUT", `/products/${productId}`, { unit_price: 50 });
    record("PUT /products/:id partial update", r.status === 200, `status=${r.status} msg=${r.data?.message || r.data?.error}`);
  }

  const stockBefore = (await req("GET", `/products/${productId}`)).data?.data?.stock_quantity;
  r = await req("POST", "/sales", {
    items: [{ product_id: productId, quantity: 9999 }],
    payment_method: "cash",
    amount_paid: 99999,
  });
  record("Sale insufficient stock -> 400", r.status === 400, `status=${r.status} msg=${r.data?.error}`);
  const stockAfter = (await req("GET", `/products/${productId}`)).data?.data?.stock_quantity;
  record("Stock rolled back after failed sale", stockBefore === stockAfter, `before=${stockBefore} after=${stockAfter}`);

  r = await req("POST", "/sales", {
    items: [{ product_id: productId, quantity: 1 }],
    payment_method: "cash",
    amount_paid: 0.5,
  });
  record("Sale insufficient payment -> 400", r.status === 400, `status=${r.status} msg=${r.data?.error}`);

  r = await req("POST", "/sales", {
    items: [{ product_id: productId, quantity: 1 }],
    payment_method: "gcash",
    amount_paid: 200,
  });
  record("Sale with snake_case payment fields", r.status === 201 && r.data?.data?.payment_method === "gcash", `status=${r.status} payment_method=${r.data?.data?.payment_method}`);

  r = await req("POST", `/inventory/product/${productId}/remove`, { quantity: 999999, reason: "test" });
  record("Inventory remove over-available -> 400", r.status === 400, `status=${r.status} msg=${r.data?.error}`);

  r = await req("POST", `/sales/${saleId}/cancel`, { reason: "again" });
  record("Cancel already-cancelled sale -> 400", r.status === 400, `status=${r.status} msg=${r.data?.error}`);

  r = await req("POST", "/scanner/bulk-scan", { items: [{ barcode: "4801234567890" }] });
  record("POST /scanner/bulk-scan", r.status === 200, `status=${r.status} msg=${r.data?.message || r.data?.error}`);

  r = await req("POST", "/scanner/quick-sale", {
    items: [{ product_id: productId, quantity: 1 }],
    payment_method: "cash",
    amount_paid: 200,
  });
  record("POST /scanner/quick-sale", r.status === 201, `status=${r.status} msg=${r.data?.message || r.data?.error}`);

  r = await req("POST", "/auth/refresh-token", { refreshToken: login.data?.data?.refreshToken }, false);
  record("POST /auth/refresh-token", r.status === 200, `status=${r.status}`);

  r = await req("POST", "/auth/logout");
  record("POST /auth/logout", r.status === 200, `status=${r.status}`);

  // Summary
  const failed = results.filter((x) => !x.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log("Failed:", failed.map((f) => f.name).join(" | "));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("SMOKE TEST CRASHED:", e);
  process.exit(1);
});