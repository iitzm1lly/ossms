use rusqlite::{Connection, Result, params, OptionalExtension};
use serde::{Deserialize, Serialize};
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSupplyRequest {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub subcategory: Option<String>,
    pub quantity: Option<i32>,
    pub unit: Option<String>,
    pub min_quantity: Option<i32>,
    pub status: Option<String>,
    pub location: Option<String>,
    pub supplier: Option<String>,
    pub supplier_name: Option<String>,
    pub supplier_contact: Option<String>,
    pub supplier_notes: Option<String>,
    pub cost: Option<f64>,
    pub pieces_per_bulk: Option<i32>,
    pub stock_in_reason: Option<String>,
    pub stock_out_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub id: String,
    pub firstname: String,
    pub lastname: String,
    pub username: String,
    pub email: String,
    pub role: String,
    pub permissions: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub password: String,
    pub firstname: String,
    pub lastname: String,
    pub email: String,
    pub role: String,
    pub permissions: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Supply {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub subcategory: Option<String>,
    pub quantity: i32,
    pub unit: String,
    pub min_quantity: i32,
    pub status: String,
    pub location: Option<String>,
    pub supplier: Option<String>,
    pub supplier_name: Option<String>,
    pub supplier_contact: Option<String>,
    pub supplier_notes: Option<String>,
    pub cost: Option<f64>,
    pub pieces_per_bulk: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupplyHistory {
    pub id: String,
    pub supply_id: String,
    pub action: String,
    pub quantity: i32,
    pub previous_quantity: i32,
    pub new_quantity: i32,
    pub notes: Option<String>,
    pub user_id: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EnrichedSupplyHistory {
    pub id: String,
    pub supply_id: String,
    pub supply_name: String,
    pub action: String,
    pub quantity: i32,
    pub previous_quantity: i32,
    pub new_quantity: i32,
    pub notes: Option<String>,
    pub user_id: String,
    pub user_name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordResetToken {
    pub id: String,
    pub user_id: String,
    pub token: String,
    pub expires_at: String,
    pub used: bool,
    pub created_at: String,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = get_database_path();
        ensure_database_directory(&db_path)?;
        
        // Check if this is a fresh installation
        let is_fresh_install = !db_path.exists();
        
        // Simple connection with basic optimizations
        let conn = Connection::open(&db_path)?;
        
        // Basic SQLite optimizations for small databases
        conn.execute_batch("
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA cache_size = -1000; -- 1MB cache (sufficient for small office)
            PRAGMA foreign_keys = ON;
        ")?;
        
        println!("Database connection opened successfully");
        
        let db = Database { 
            conn, 
        };
        
        // Always initialize tables (safe with IF NOT EXISTS)
        db.init_tables()?;
        
        // Always ensure admin user exists
        db.insert_default_admin()?;
        
        // Only seed sample data on fresh install or if no sample data exists
        if is_fresh_install {
            println!("Fresh installation detected, seeding sample data...");
            db.seed_sample_data_automatically()?;
        } else {
            // Check if sample data exists, seed if not
            db.seed_sample_data_automatically()?;
        }
        
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        println!("Initializing database tables...");
        
        // Users table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                firstname TEXT NOT NULL,
                lastname TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                permissions TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;
        println!("Users table created/verified");

        // Supplies table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS supplies (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                subcategory TEXT,
                quantity INTEGER NOT NULL DEFAULT 0,
                unit TEXT NOT NULL,
                min_quantity INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'active',
                location TEXT,
                supplier TEXT,
                supplier_name TEXT,
                supplier_contact TEXT,
                supplier_notes TEXT,
                cost REAL,
                pieces_per_bulk INTEGER DEFAULT 12,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;
        
        // Add subcategory column if it doesn't exist (for existing databases)
        let _ = self.conn.execute("ALTER TABLE supplies ADD COLUMN subcategory TEXT", []);
        // Add pieces_per_bulk column if it doesn't exist (for existing databases)
        let _ = self.conn.execute("ALTER TABLE supplies ADD COLUMN pieces_per_bulk INTEGER DEFAULT 12", []);
        // Add separate supplier columns if they don't exist (for existing databases)
        let _ = self.conn.execute("ALTER TABLE supplies ADD COLUMN supplier_name TEXT", []);
        let _ = self.conn.execute("ALTER TABLE supplies ADD COLUMN supplier_contact TEXT", []);
        let _ = self.conn.execute("ALTER TABLE supplies ADD COLUMN supplier_notes TEXT", []);
        println!("Supplies table created/verified");

        // Supply history table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS supply_histories (
                id TEXT PRIMARY KEY,
                supply_id TEXT NOT NULL,
                action TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                previous_quantity INTEGER NOT NULL,
                new_quantity INTEGER NOT NULL,
                notes TEXT,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        println!("Supply history table created/verified");

        // Password reset tokens table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at TEXT NOT NULL,
                used BOOLEAN NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        println!("Password reset tokens table created/verified");

        Ok(())
    }

    fn insert_default_admin(&self) -> Result<()> {
        println!("Checking for existing admin user...");
        
        // Check if admin user already exists
        let count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM users WHERE username = ?",
            params!["admin"],
            |row| row.get(0)
        )?;

        println!("Found {} existing admin users", count);

        if count == 0 {
            println!("Creating default admin user...");
            let hashed_password = hash("password", DEFAULT_COST)
                .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            let now = chrono::Utc::now().to_rfc3339();
            
            // Create admin permissions with full access
            let admin_permissions = r#"{
                "users": ["view", "create", "edit", "delete"],
                "supplies": ["view", "create", "edit", "delete"],
                "supply_histories": ["view", "create", "edit", "delete"],
                "reports": ["view"]
            }"#;
            
            self.conn.execute(
                "INSERT INTO users (id, username, password, firstname, lastname, email, role, permissions, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                params![
                    Uuid::new_v4().to_string(),
                    "admin",
                    hashed_password,
                    "Admin",
                    "User",
                    "admin@ossms.com",
                    "admin",
                    admin_permissions,
                    now,
                    now
                ],
            )?;
            println!("Default admin user created successfully");
        } else {
            println!("Admin user already exists, skipping creation");
        }

        Ok(())
    }

    // User operations
    pub fn get_users(&self) -> Result<Vec<User>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, username, password, firstname, lastname, email, role, permissions, created_at, updated_at 
             FROM users ORDER BY created_at DESC"
        )?;
        
        let users = stmt.query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                password: row.get(2)?,
                firstname: row.get(3)?,
                lastname: row.get(4)?,
                email: row.get(5)?,
                role: row.get(6)?,
                permissions: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(users)
    }

    // Simple user lookup (no complex optimizations)
    pub fn get_user_by_username(&self, username: &str) -> Result<Option<User>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, username, password, firstname, lastname, email, role, permissions, created_at, updated_at 
             FROM users WHERE username = ?"
        )?;
        
        let user = stmt.query_row(params![username], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                password: row.get(2)?,
                firstname: row.get(3)?,
                lastname: row.get(4)?,
                email: row.get(5)?,
                role: row.get(6)?,
                permissions: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        }).optional()?;

        Ok(user)
    }

    pub fn create_user(&self, user_data: &User) -> Result<String> {
        let hashed_password = hash(&user_data.password, DEFAULT_COST)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO users (id, username, password, firstname, lastname, email, role, permissions, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                user_data.id,
                user_data.username,
                hashed_password,
                user_data.firstname,
                user_data.lastname,
                user_data.email,
                user_data.role,
                user_data.permissions,
                now,
                now
            ],
        )?;

        Ok(user_data.id.clone())
    }

    pub fn verify_password(&self, username: &str, password: &str) -> Result<bool> {
        println!("Verifying password for user: {}", username);
        
        if let Some(user) = self.get_user_by_username(username)? {
            println!("User found, verifying password...");
            let is_valid = verify(password, &user.password)
                .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            println!("Password verification result: {}", is_valid);
            Ok(is_valid)
        } else {
            println!("User not found: {}", username);
            Ok(false)
        }
    }

    pub fn get_user_by_email(&self, email: &str) -> Result<Option<User>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, username, password, firstname, lastname, email, role, permissions, created_at, updated_at 
             FROM users WHERE email = ?"
        )?;
        
        let user = stmt.query_row(params![email], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                password: row.get(2)?,
                firstname: row.get(3)?,
                lastname: row.get(4)?,
                email: row.get(5)?,
                role: row.get(6)?,
                permissions: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        }).optional()?;

        Ok(user)
    }

    pub fn update_user_password(&self, user_id: &str, new_password: &str) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
            params![new_password, now, user_id],
        )?;

        Ok(())
    }



    pub fn delete_user(&self, user_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM users WHERE id = ?",
            params![user_id],
        )?;

        Ok(())
    }

    // Supply operations
    // Simple supplies query
    pub fn get_supplies(&self) -> Result<Vec<Supply>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, category, subcategory, quantity, unit, min_quantity, status, location, supplier, supplier_name, supplier_contact, supplier_notes, cost, pieces_per_bulk, created_at, updated_at 
             FROM supplies ORDER BY updated_at DESC"
        )?;
        
        let supplies = stmt.query_map([], |row| {
            Ok(Supply {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                category: row.get(3)?,
                subcategory: row.get(4)?,
                quantity: row.get(5)?,
                unit: row.get(6)?,
                min_quantity: row.get(7)?,
                status: row.get(8)?,
                location: row.get(9)?,
                supplier: row.get(10)?,
                supplier_name: row.get(11)?,
                supplier_contact: row.get(12)?,
                supplier_notes: row.get(13)?,
                cost: row.get(14)?,
                pieces_per_bulk: row.get(15)?,
                created_at: row.get(16)?,
                updated_at: row.get(17)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(supplies)
    }

    pub fn create_supply(&self, supply_data: &Supply) -> Result<String> {
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO supplies (id, name, description, category, subcategory, quantity, unit, min_quantity, status, location, supplier, supplier_name, supplier_contact, supplier_notes, cost, pieces_per_bulk, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                supply_data.id,
                supply_data.name,
                supply_data.description,
                supply_data.category,
                supply_data.subcategory,
                supply_data.quantity,
                supply_data.unit,
                supply_data.min_quantity,
                supply_data.status,
                supply_data.location,
                supply_data.supplier,
                supply_data.supplier_name,
                supply_data.supplier_contact,
                supply_data.supplier_notes,
                supply_data.cost,
                supply_data.pieces_per_bulk,
                now,
                now
            ],
        )?;

        Ok(supply_data.id.clone())
    }

    // Supply history operations
    // Simple supply histories query
    pub fn get_supply_histories(&self) -> Result<Vec<EnrichedSupplyHistory>> {
        let mut stmt = self.conn.prepare(
            "SELECT sh.id, sh.supply_id, s.name, sh.action, sh.quantity, sh.previous_quantity, sh.new_quantity, sh.notes, sh.user_id, 
                    CASE 
                        WHEN u.firstname IS NOT NULL AND u.lastname IS NOT NULL 
                        THEN u.firstname || ' ' || u.lastname 
                        ELSE u.username 
                    END as user_name, 
                    sh.created_at 
             FROM supply_histories sh 
             JOIN supplies s ON sh.supply_id = s.id 
             JOIN users u ON sh.user_id = u.id 
             ORDER BY sh.created_at DESC"
        )?;
        
        let histories = stmt.query_map([], |row| {
            Ok(EnrichedSupplyHistory {
                id: row.get(0)?,
                supply_id: row.get(1)?,
                supply_name: row.get(2)?,
                action: row.get(3)?,
                quantity: row.get(4)?,
                previous_quantity: row.get(5)?,
                new_quantity: row.get(6)?,
                notes: row.get(7)?,
                user_id: row.get(8)?,
                user_name: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(histories)
    }

    pub fn create_supply_history(&self, history_data: &SupplyHistory) -> Result<String> {
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO supply_histories (id, supply_id, action, quantity, previous_quantity, new_quantity, notes, user_id, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                history_data.id,
                history_data.supply_id,
                history_data.action,
                history_data.quantity,
                history_data.previous_quantity,
                history_data.new_quantity,
                history_data.notes,
                history_data.user_id,
                now
            ],
        )?;

        Ok(history_data.id.clone())
    }



    pub fn update_user(&self, user_id: &str, request: &UpdateUserRequest) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "UPDATE users SET firstname = ?, lastname = ?, username = ?, email = ?, role = ?, permissions = ?, updated_at = ? WHERE id = ?",
            params![
                request.firstname,
                request.lastname,
                request.username,
                request.email,
                request.role,
                request.permissions,
                now,
                user_id
            ],
        )?;
        Ok(())
    }

    // Public methods for seeding data
    pub fn insert_user(&self, id: &str, username: &str, password: &str, firstname: &str, lastname: &str, email: &str, role: &str, permissions: &str, created_at: &str, updated_at: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO users (id, username, password, firstname, lastname, email, role, permissions, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, username, password, firstname, lastname, email, role, permissions, created_at, updated_at],
        )?;
        Ok(())
    }

    pub fn insert_supply(&self, id: &str, name: &str, description: Option<&str>, category: &str, subcategory: Option<&str>, quantity: i32, unit: &str, min_quantity: i32, status: &str, location: Option<&str>, supplier: Option<&str>, supplier_name: Option<&str>, supplier_contact: Option<&str>, supplier_notes: Option<&str>, cost: Option<f64>, pieces_per_bulk: Option<i32>, created_at: &str, updated_at: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO supplies (id, name, description, category, subcategory, quantity, unit, min_quantity, status, location, supplier, supplier_name, supplier_contact, supplier_notes, cost, pieces_per_bulk, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, name, description, category, subcategory, quantity, unit, min_quantity, status, location, supplier, supplier_name, supplier_contact, supplier_notes, cost, pieces_per_bulk, created_at, updated_at],
        )?;
        Ok(())
    }

    pub fn insert_supply_history(&self, id: &str, supply_id: &str, action: &str, quantity: i32, previous_quantity: i32, new_quantity: i32, notes: Option<&str>, user_id: &str, created_at: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO supply_histories (id, supply_id, action, quantity, previous_quantity, new_quantity, notes, user_id, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, supply_id, action, quantity, previous_quantity, new_quantity, notes, user_id, created_at],
        )?;
        Ok(())
    }

    pub fn get_supply_id_by_name(&self, name: &str) -> Result<String> {
        let supply_id: String = self.conn.query_row(
            "SELECT id FROM supplies WHERE name = ?",
            params![name],
            |row| row.get(0)
        )?;
        Ok(supply_id)
    }

    pub fn get_supply_quantity(&self, supply_id: &str) -> Result<i32> {
        let quantity: i32 = self.conn.query_row(
            "SELECT quantity FROM supplies WHERE id = ?",
            params![supply_id],
            |row| row.get(0)
        )?;
        Ok(quantity)
    }

    pub fn update_supply_quantity(&self, supply_id: &str, new_quantity: i32, updated_at: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE supplies SET quantity = ?, updated_at = ? WHERE id = ?",
            params![new_quantity, updated_at, supply_id],
        )?;
        Ok(())
    }

    pub fn get_supply_by_id(&self, supply_id: &str) -> Result<Supply> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, category, subcategory, quantity, unit, min_quantity, status, location, supplier, supplier_name, supplier_contact, supplier_notes, cost, pieces_per_bulk, created_at, updated_at 
             FROM supplies WHERE id = ?"
        )?;
        
        let supply = stmt.query_row(params![supply_id], |row| {
            Ok(Supply {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                category: row.get(3)?,
                subcategory: row.get(4)?,
                quantity: row.get(5)?,
                unit: row.get(6)?,
                min_quantity: row.get(7)?,
                status: row.get(8)?,
                location: row.get(9)?,
                supplier: row.get(10)?,
                supplier_name: row.get(11)?,
                supplier_contact: row.get(12)?,
                supplier_notes: row.get(13)?,
                cost: row.get(14)?,
                pieces_per_bulk: row.get(15)?,
                created_at: row.get(16)?,
                updated_at: row.get(17)?,
            })
        })?;

        Ok(supply)
    }

    pub fn update_supply(&self, supply_id: &str, request: &UpdateSupplyRequest) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        
        // Build dynamic UPDATE query based on provided fields
        let mut query_parts = Vec::new();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(name) = &request.name {
            query_parts.push("name = ?");
            params.push(Box::new(name.clone()));
        }
        
        if let Some(description) = &request.description {
            query_parts.push("description = ?");
            params.push(Box::new(description.clone()));
        }
        
        if let Some(category) = &request.category {
            query_parts.push("category = ?");
            params.push(Box::new(category.clone()));
        }
        
        if let Some(subcategory) = &request.subcategory {
            query_parts.push("subcategory = ?");
            params.push(Box::new(subcategory.clone()));
        }
        
        if let Some(quantity) = &request.quantity {
            query_parts.push("quantity = ?");
            params.push(Box::new(*quantity));
        }
        
        if let Some(unit) = &request.unit {
            query_parts.push("unit = ?");
            params.push(Box::new(unit.clone()));
        }
        
        if let Some(min_quantity) = &request.min_quantity {
            query_parts.push("min_quantity = ?");
            params.push(Box::new(*min_quantity));
        }
        
        if let Some(status) = &request.status {
            query_parts.push("status = ?");
            params.push(Box::new(status.clone()));
        }
        
        if let Some(location) = &request.location {
            query_parts.push("location = ?");
            params.push(Box::new(location.clone()));
        }
        
        if let Some(supplier) = &request.supplier {
            query_parts.push("supplier = ?");
            params.push(Box::new(supplier.clone()));
        }
        
        if let Some(supplier_name) = &request.supplier_name {
            query_parts.push("supplier_name = ?");
            params.push(Box::new(supplier_name.clone()));
        }
        
        if let Some(supplier_contact) = &request.supplier_contact {
            query_parts.push("supplier_contact = ?");
            params.push(Box::new(supplier_contact.clone()));
        }
        
        if let Some(supplier_notes) = &request.supplier_notes {
            query_parts.push("supplier_notes = ?");
            params.push(Box::new(supplier_notes.clone()));
        }
        
        if let Some(cost) = &request.cost {
            query_parts.push("cost = ?");
            params.push(Box::new(*cost));
        }
        
        if let Some(pieces_per_bulk) = &request.pieces_per_bulk {
            query_parts.push("pieces_per_bulk = ?");
            params.push(Box::new(*pieces_per_bulk));
        }
        
        // Always update the updated_at timestamp
        query_parts.push("updated_at = ?");
        params.push(Box::new(now.clone()));
        
        // Add the supply_id for the WHERE clause
        params.push(Box::new(supply_id.to_string()));
        
        let query = format!(
            "UPDATE supplies SET {} WHERE id = ?",
            query_parts.join(", ")
        );
        
        // Convert params to the format expected by rusqlite
        let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        
        self.conn.execute(&query, rusqlite::params_from_iter(params_refs))?;
        Ok(())
    }

    pub fn delete_supply(&self, supply_id: &str) -> Result<()> {
        // First, create a history record for the deletion
        let supply = self.get_supply_by_id(supply_id)?;
        let now = chrono::Utc::now().to_rfc3339();
        
        // Create history record for deletion
        let history = SupplyHistory {
            id: uuid::Uuid::new_v4().to_string(),
            supply_id: supply_id.to_string(),
            action: "Delete".to_string(),
            quantity: supply.quantity,
            previous_quantity: supply.quantity,
            new_quantity: 0,
            notes: Some("Item permanently removed from inventory".to_string()),
            user_id: "admin".to_string(), // Default to admin for now
            created_at: now.clone(),
        };
        
        self.create_supply_history(&history)?;
        
        // Delete the supply
        self.conn.execute(
            "DELETE FROM supplies WHERE id = ?",
            params![supply_id]
        )?;
        
        Ok(())
    }

    pub fn delete_supply_history(&self, history_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM supply_histories WHERE id = ?",
            params![history_id]
        )?;
        
        Ok(())
    }



    // Clear ALL data except admin user


    // Automatic sample data seeding on first run
    fn seed_sample_data_automatically(&self) -> Result<()> {
        // Check if sample data already exists
        let sample_supply_count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM supplies WHERE name IN ('Blue Ballpoint Pens', 'Black Markers', 'Yellow Highlighters')",
            [],
            |row| row.get(0)
        ).unwrap_or(0);
        
        // If sample data doesn't exist, seed it
        if sample_supply_count == 0 {
            println!("Seeding sample data automatically...");
            self.seed_sample_data_internal()?;
            println!("Sample data seeded successfully!");
        } else {
            println!("Sample data already exists, skipping automatic seeding.");
        }
        
        Ok(())
    }

    // Internal seeding function (moved from main.rs)
    fn seed_sample_data_internal(&self) -> Result<()> {
        // Get admin user ID for history records
        let admin_user = self.get_user_by_username("admin")?;
        let admin_id = if let Some(user) = admin_user {
            user.id
        } else {
            return Err(rusqlite::Error::InvalidParameterName("Admin user not found".to_string()));
        };
        
        // Sample users
        let sample_users = vec![
            ("john.doe", "password123", "John", "Doe", "john.doe@company.com", "staff", r#"{"supplies": ["view", "create", "edit"], "supply_histories": ["view", "create"], "reports": ["view"]}"#),
            ("jane.smith", "password123", "Jane", "Smith", "jane.smith@company.com", "staff", r#"{"supplies": ["view", "create", "edit"], "supply_histories": ["view", "create"], "reports": ["view"]}"#),
            ("bob.wilson", "password123", "Bob", "Wilson", "bob.wilson@company.com", "viewer", r#"{"supplies": ["view"], "supply_histories": ["view"], "reports": ["view"]}"#),
        ];
        
        for (username, password, firstname, lastname, email, role, permissions) in sample_users {
            let hashed_password = bcrypt::hash(password, bcrypt::DEFAULT_COST)
                .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to hash password: {}", e)))?;
            let now = chrono::Utc::now().to_rfc3339();
            
            self.insert_user(
                &uuid::Uuid::new_v4().to_string(),
                username,
                &hashed_password,
                firstname,
                lastname,
                email,
                role,
                permissions,
                &now,
                &now
            )?;
        }
        
        // Get other user IDs after they're created
        let john_user = self.get_user_by_username("john.doe")?;
        let john_id = if let Some(user) = john_user {
            user.id
        } else {
            return Err(rusqlite::Error::InvalidParameterName("John user not found".to_string()));
        };
        
        let jane_user = self.get_user_by_username("jane.smith")?;
        let jane_id = if let Some(user) = jane_user {
            user.id
        } else {
            return Err(rusqlite::Error::InvalidParameterName("Jane user not found".to_string()));
        };
        
        let bob_user = self.get_user_by_username("bob.wilson")?;
        let bob_id = if let Some(user) = bob_user {
            user.id
        } else {
            return Err(rusqlite::Error::InvalidParameterName("Bob user not found".to_string()));
        };
        
        // Sample supplies using the correct categories and subcategories from the add item form
        let sample_supplies = vec![
            // Writing Instruments
            ("Blue Ballpoint Pens", Some("Smooth writing blue ballpoint pens, 12 per box"), "writing", Some("pens"), 120, "box", 20, "active", Some("Storage Room A"), Some("National Book Store"), Some("+63 912 345 6789"), Some("Reliable supplier for writing materials"), Some(8.99)),
            ("Black Markers", Some("Permanent black markers, non-toxic, 10 per pack"), "writing", Some("markers"), 50, "pack", 10, "active", Some("Storage Room A"), Some("Office Warehouse"), Some("+63 923 456 7890"), Some("Quality markers for office use"), Some(12.75)),
            ("Yellow Highlighters", Some("Fluorescent yellow highlighters, 12 per box"), "writing", Some("highlighters"), 60, "box", 15, "active", Some("Storage Room A"), Some("National Book Store"), Some("+63 934 567 8901"), Some("Bright highlighters for document marking"), Some(9.50)),
            ("Mechanical Pencils", Some("0.5mm mechanical pencils, 12 per pack"), "writing", Some("pencils"), 48, "pack", 8, "active", Some("Storage Room A"), Some("Office Warehouse"), Some("+63 945 678 9012"), Some("Precision mechanical pencils"), Some(6.99)),
            
            // Paper Products
            ("A4 Bond Paper", Some("High-quality A4 printer paper, 80gsm, 500 sheets per ream"), "paper", Some("bond_paper"), 1000, "ream", 100, "active", Some("Storage Room B"), Some("Paper Source Philippines"), Some("+63 956 789 0123"), Some("Premium paper supplier"), Some(25.99)),
            ("Spiral Notebooks", Some("A5 spiral-bound notebooks, lined paper, 5 per pack"), "paper", Some("notebooks"), 25, "pack", 5, "active", Some("Storage Room B"), Some("National Book Store"), Some("+63 967 890 1234"), Some("Quality notebooks for daily use"), Some(15.00)),
            ("Sticky Notes", Some("3x3 inch sticky notes, assorted colors, 12 pads per pack"), "paper", Some("sticky_notes"), 48, "pack", 10, "active", Some("Storage Room B"), Some("Office Warehouse"), Some("+63 978 901 2345"), Some("Colorful sticky notes for organization"), Some(7.99)),
            ("Specialty Paper", Some("Colored cardstock paper, 50 sheets per pack"), "paper", Some("specialty_paper"), 100, "pack", 20, "active", Some("Storage Room B"), Some("Paper Source Philippines"), Some("+63 989 012 3456"), Some("Specialty paper for creative projects"), Some(18.50)),
            
            // Filing & Storage
            ("Manila Folders", Some("Letter-size manila folders, 100 per box"), "filing", Some("folders"), 200, "box", 50, "active", Some("Storage Room C"), Some("Office Warehouse"), Some("+63 990 123 4567"), Some("Durable filing folders"), Some(18.50)),
            ("Binder Clips", Some("Assorted size binder clips, 100 per box"), "filing", Some("clips"), 300, "box", 75, "active", Some("Storage Room C"), Some("National Book Store"), Some("+63 901 234 5678"), Some("Assorted binder clips for documents"), Some(12.99)),
            ("Storage Boxes", Some("Plastic storage boxes with lids, 5 per set"), "filing", Some("storage_boxes"), 10, "set", 2, "active", Some("Storage Room C"), Some("Storage Solutions PH"), Some("+63 912 345 6789"), Some("Plastic storage solutions"), Some(45.00)),
            ("Document Binders", Some("3-ring binders, assorted colors, 10 per pack"), "filing", Some("binders"), 20, "pack", 4, "active", Some("Storage Room C"), Some("Office Warehouse"), Some("+63 923 456 7890"), Some("Professional document binders"), Some(32.00)),
            
            // Desk Accessories
            ("Staplers", Some("Heavy-duty staplers, 5 per set"), "desk", Some("staplers"), 10, "set", 2, "active", Some("Storage Room A"), Some("National Book Store"), Some("+63 934 567 8901"), Some("Heavy-duty staplers for office use"), Some(35.00)),
            ("Scotch Tape", Some("3M Scotch tape rolls, 12 per box"), "desk", Some("tape"), 24, "box", 6, "active", Some("Storage Room A"), Some("Office Warehouse"), Some("+63 945 678 9012"), Some("High-quality adhesive tape"), Some(14.99)),
            ("Scissors", Some("Office scissors, 5 per set"), "desk", Some("scissors"), 10, "set", 2, "active", Some("Storage Room A"), Some("National Book Store"), Some("+63 956 789 0123"), Some("Sharp office scissors"), Some(28.50)),
            ("Desk Organizers", Some("Multi-compartment desk organizers, 3 per set"), "desk", Some("organizers"), 6, "set", 1, "active", Some("Storage Room A"), Some("Storage Solutions PH"), Some("+63 967 890 1234"), Some("Multi-functional desk organizers"), Some(55.00)),
            
            // Technology
            ("USB Flash Drives", Some("32GB USB 3.0 flash drives, 10 per pack"), "tech", Some("usb_drives"), 20, "pack", 5, "active", Some("Storage Room D"), Some("Tech Solutions PH"), Some("+63 978 901 2345"), Some("High-speed USB drives"), Some(89.99)),
            ("HDMI Cables", Some("6ft HDMI cables, 5 per pack"), "tech", Some("cables"), 15, "pack", 3, "active", Some("Storage Room D"), Some("Tech Solutions PH"), Some("+63 989 012 3456"), Some("Quality HDMI cables"), Some(25.00)),
            ("AA Batteries", Some("Alkaline AA batteries, 24 per pack"), "tech", Some("batteries"), 48, "pack", 12, "active", Some("Storage Room D"), Some("Tech Solutions PH"), Some("+63 990 123 4567"), Some("Long-lasting alkaline batteries"), Some(18.99)),
            ("Computer Mice", Some("Wireless optical mice, 5 per pack"), "tech", Some("peripherals"), 10, "pack", 2, "active", Some("Storage Room D"), Some("Tech Solutions PH"), Some("+63 901 234 5678"), Some("Wireless computer peripherals"), Some(75.00)),
            
            // Other
            ("Cleaning Wipes", Some("Disinfecting cleaning wipes, 80 per pack"), "other", Some("cleaning"), 160, "pack", 20, "active", Some("Storage Room E"), Some("Cleaning Supplies PH"), Some("+63 912 345 6789"), Some("Disinfecting cleaning supplies"), Some(22.50)),
            ("Coffee Beans", Some("Premium coffee beans for office coffee machine, 1kg per bag"), "other", Some("misc"), 10, "unit", 2, "active", Some("Kitchen"), Some("Coffee Corner PH"), Some("+63 923 456 7890"), Some("Premium coffee beans"), Some(45.00)),
        ];
        
        for (name, description, category, subcategory, quantity, unit, min_quantity, status, location, supplier_name, supplier_contact, supplier_notes, cost) in sample_supplies {
            let supply_id = uuid::Uuid::new_v4().to_string();
            let now = chrono::Utc::now().to_rfc3339();
            
            // Calculate pieces_per_bulk based on unit type
            let pieces_per_bulk = match unit {
                "box" => Some(12),
                "pack" => Some(10),
                "ream" => Some(500),
                "set" => Some(5),
                "roll" => Some(1),
                "bottle" => Some(1),
                "carton" => Some(24),
                "bulk" => Some(12),
                "unit" => Some(1),
                "piece" => Some(1),
                "item" => Some(1),
                _ => Some(12), // Default fallback
            };
            
            self.insert_supply(
                &supply_id,
                name,
                description,
                category,
                subcategory,
                quantity,
                unit,
                min_quantity,
                status,
                location,
                None,
                supplier_name,
                supplier_contact,
                supplier_notes,
                cost,
                pieces_per_bulk,
                &now,
                &now
            )?;
            
            // Create initial stock-in history for each supply (3 months ago)
            let initial_date = chrono::Utc::now() - chrono::Duration::days(90);
            self.insert_supply_history(
                &uuid::Uuid::new_v4().to_string(),
                &supply_id,
                "Stock In",
                quantity,
                0,
                quantity,
                Some("Initial stock"),
                &admin_id,
                &initial_date.to_rfc3339()
            )?;
        }
        
        // Additional supply history records for testing with realistic dates and different users
        let additional_history = vec![
            ("A4 Bond Paper", "Stock Out", 100, "Meeting room supplies", 75, &admin_id), // 75 days ago
            ("Blue Ballpoint Pens", "Stock Out", 24, "IT department", 60, &john_id), // 60 days ago
            ("Binder Clips", "Stock In", 100, "Restock order", 45, &jane_id), // 45 days ago
            ("Black Markers", "Stock Out", 20, "Training session", 30, &bob_id), // 30 days ago
            ("Coffee Beans", "Stock Out", 2, "Weekly consumption", 20, &admin_id), // 20 days ago
            ("Sticky Notes", "Stock In", 24, "Emergency order", 15, &john_id), // 15 days ago
            ("USB Flash Drives", "Stock Out", 5, "IT department", 10, &jane_id), // 10 days ago
            ("A4 Bond Paper", "Stock Out", 50, "Office supplies", 7, &bob_id), // 7 days ago
            ("Blue Ballpoint Pens", "Stock In", 36, "Monthly restock", 5, &admin_id), // 5 days ago
            ("Binder Clips", "Stock Out", 50, "Department request", 3, &john_id), // 3 days ago
            ("Coffee Beans", "Stock In", 3, "Weekly restock", 2, &jane_id), // 2 days ago
            ("Black Markers", "Stock Out", 10, "New employee setup", 1, &bob_id), // 1 day ago
        ];
        
        for (supply_name, action, quantity, notes, days_ago, user_id) in additional_history {
            // Get supply ID
            let supply_id = self.get_supply_id_by_name(supply_name)?;
            
            // Get current quantity
            let current_quantity = self.get_supply_quantity(&supply_id)?;
            
            // Calculate new quantity
            let new_quantity = match action {
                "Stock In" => current_quantity + quantity,
                "Stock Out" => current_quantity - quantity,
                _ => current_quantity
            };
            
            // Calculate realistic date for this transaction
            let transaction_date = chrono::Utc::now() - chrono::Duration::days(days_ago);
            
            // Update supply quantity (use transaction date)
            self.update_supply_quantity(&supply_id, new_quantity, &transaction_date.to_rfc3339())?;
            
            // Create history record with realistic date
            self.insert_supply_history(
                &uuid::Uuid::new_v4().to_string(),
                &supply_id,
                action,
                quantity,
                current_quantity,
                new_quantity,
                Some(notes),
                user_id,
                &transaction_date.to_rfc3339()
            )?;
        }
        
        Ok(())
    }

    // Password reset token methods
    pub fn create_password_reset_token(&self, user_id: &str, token: &str, expires_at: &str) -> Result<String> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)",
            params![id, user_id, token, expires_at, now],
        )?;
        
        Ok(id)
    }

    pub fn get_password_reset_token(&self, token: &str) -> Result<Option<PasswordResetToken>> {
        let token_data = self.conn.query_row(
            "SELECT id, user_id, token, expires_at, used, created_at FROM password_reset_tokens WHERE token = ?",
            params![token],
            |row| {
                Ok(PasswordResetToken {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    token: row.get(2)?,
                    expires_at: row.get(3)?,
                    used: row.get(4)?,
                    created_at: row.get(5)?,
                })
            }
        ).optional()?;
        
        Ok(token_data)
    }

    pub fn mark_token_as_used(&self, token: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE password_reset_tokens SET used = 1 WHERE token = ?",
            params![token],
        )?;
        Ok(())
    }

    pub fn cleanup_expired_tokens(&self) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "DELETE FROM password_reset_tokens WHERE expires_at < ? OR used = 1",
            params![now],
        )?;
        Ok(())
    }
}

fn get_database_path() -> PathBuf {
    let mut path = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push(".ossms");
    path.push("ossms.db");
    path
}

fn ensure_database_directory(db_path: &PathBuf) -> Result<()> {
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
    }
    Ok(())
} 