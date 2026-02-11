const { pool } = require("../config/database");
const bcrypt = require("bcrypt");

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.full_name = data.full_name;
    this.role = data.role;
    this.store_id = data.store_id;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const {
      email,
      password,
      full_name,
      role = "cashier",
      store_id,
      is_active = true,
    } = userData;

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (
        email, password_hash, full_name, role, store_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [email, password_hash, full_name, role, store_id, is_active];

    const result = await pool.query(query, values);
    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const query = "SELECT * FROM users WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find user by email
  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find all users with filters
  static async findAll(filters = {}, options = {}) {
    let query = "SELECT * FROM users";
    const values = [];
    let whereClause = "";
    const conditions = [];

    // Apply filters
    if (filters.role) {
      conditions.push(`role = $${values.length + 1}`);
      values.push(filters.role);
    }

    if (filters.store_id) {
      conditions.push(`store_id = $${values.length + 1}`);
      values.push(filters.store_id);
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = $${values.length + 1}`);
      values.push(filters.is_active);
    }

    if (conditions.length > 0) {
      whereClause = " WHERE " + conditions.join(" AND ");
    }

    query += whereClause;

    // Apply ordering and limits
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || "ASC"}`;
    }

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => new User(row));
  }

  // Update user
  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    // Handle password hashing if password is being updated
    let setClause = "";
    const values = [];
    let paramIndex = 1;

    fields.forEach((field, index) => {
      if (field === "password") {
        // Hash the new password
        const saltRounds = 10;
        bcrypt.hash(updateData[field], saltRounds).then(hashedPassword => {
          setClause += `${field}_hash = $${paramIndex}${index < fields.length - 1 ? ", " : ""}`;
          values.push(hashedPassword);
          paramIndex++;
        });
      } else {
        setClause += `${field} = $${paramIndex}${index < fields.length - 1 ? ", " : ""}`;
        values.push(updateData[field]);
        paramIndex++;
      }
    });

    values.push(id);

    const query = `
      UPDATE users
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Delete user
  static async delete(id) {
    const query = "DELETE FROM users WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Validate password
  async validatePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  // Check if user has a specific role
  hasRole(role) {
    return this.role === role;
  }

  // Check if user has permission
  hasPermission(permission) {
    // Define role-based permissions
    const permissions = {
      owner: [
        "manage_users",
        "manage_products",
        "view_reports",
        "manage_settings",
        "use_scanner",
        "process_sales",
      ],
      manager: [
        "manage_products",
        "view_reports",
        "use_scanner",
        "process_sales",
      ],
      cashier: ["use_scanner", "process_sales"],
    };

    return permissions[this.role] && permissions[this.role].includes(permission);
  }
}

module.exports = User;