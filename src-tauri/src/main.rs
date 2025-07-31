// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;

use database::{Database, User, Supply, SupplyHistory, EnrichedSupplyHistory, UpdateSupplyRequest};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// App state with connection pooling
struct AppState {
    db: Mutex<Database>,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginResponse {
    success: bool,
    user: Option<User>,
    error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateUserRequest {
    username: String,
    password: String,
    firstname: String,
    lastname: String,
    email: String,
    role: String,
    permissions: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateSupplyRequest {
    name: String,
    description: Option<String>,
    category: String,
    subcategory: Option<String>,
    quantity: i32,
    unit: String,
    min_quantity: i32,
    status: String,
    location: Option<String>,
    supplier: Option<String>,
    supplier_name: Option<String>,
    supplier_contact: Option<String>,
    supplier_notes: Option<String>,
    cost: Option<f64>,
    pieces_per_bulk: Option<i32>,
}



// Optimized API Commands
#[tauri::command]
async fn login(
    state: State<'_, AppState>,
    request: LoginRequest,
) -> Result<LoginResponse, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // First, check if user exists
    match db.get_user_by_username(&request.username) {
        Ok(Some(user)) => {
            // Now verify password
            match db.verify_password(&request.username, &request.password) {
                Ok(true) => {
                    Ok(LoginResponse {
                        success: true,
                        user: Some(user),
                        error: None,
                    })
                }
                Ok(false) => {
                    Ok(LoginResponse {
                        success: false,
                        user: None,
                        error: Some("Invalid credentials".to_string()),
                    })
                }
                Err(e) => {
                    Ok(LoginResponse {
                        success: false,
                        user: None,
                        error: Some(format!("Database error: {}", e)),
                    })
                }
            }
        }
        Ok(None) => {
            Ok(LoginResponse {
                success: false,
                user: None,
                error: Some("User not found".to_string()),
            })
        }
        Err(e) => {
            Ok(LoginResponse {
                success: false,
                user: None,
                error: Some(format!("Database error: {}", e)),
            })
        }
    }
}

#[tauri::command]
async fn get_users(state: State<'_, AppState>) -> Result<Vec<User>, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    db.get_users().map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
async fn create_user(
    state: State<'_, AppState>,
    request: CreateUserRequest,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    let user = User {
        id: uuid::Uuid::new_v4().to_string(),
        username: request.username,
        password: request.password,
        firstname: request.firstname,
        lastname: request.lastname,
        email: request.email,
        role: request.role,
        permissions: request.permissions,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    };
    
    db.create_user(&user).map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
async fn update_user(
    state: State<'_, AppState>,
    request: database::UpdateUserRequest,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Update the user directly by ID
    db.update_user(&request.id, &request).map_err(|e| format!("Database error: {}", e))?;
    Ok("User updated successfully".to_string())
}

#[tauri::command]
async fn get_supplies(state: State<'_, AppState>) -> Result<Vec<Supply>, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    db.get_supplies().map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
async fn create_supply(
    state: State<'_, AppState>,
    request: CreateSupplyRequest,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    let supply = Supply {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        description: request.description,
        category: request.category,
        subcategory: request.subcategory,
        quantity: request.quantity,
        unit: request.unit,
        min_quantity: request.min_quantity,
        status: request.status,
        location: request.location,
        supplier: request.supplier,
        supplier_name: request.supplier_name,
        supplier_contact: request.supplier_contact,
        supplier_notes: request.supplier_notes,
        cost: request.cost,
        pieces_per_bulk: request.pieces_per_bulk,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    };
    
    db.create_supply(&supply).map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
async fn update_supply(
    state: State<'_, AppState>,
    request: UpdateSupplyRequest,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Get current user from the request context (for now, we'll use admin)
    let admin_user = db.get_user_by_username("admin").map_err(|e| format!("Failed to get admin user: {}", e))?;
    let user_id = if let Some(user) = admin_user {
        user.id
    } else {
        return Err("Admin user not found".to_string());
    };
    
    // Get current supply to calculate quantity changes
    let current_supply = db.get_supply_by_id(&request.id).map_err(|e| format!("Failed to get supply: {}", e))?;
    let current_quantity = current_supply.quantity;
    let new_quantity = request.quantity.unwrap_or(current_quantity);
    
    // Update the supply
    db.update_supply(&request.id, &request).map_err(|e| format!("Failed to update supply: {}", e))?;
    
    // Check if item details were modified (excluding quantity)
    let item_details_changed = 
        request.name.is_some() || 
        request.description.is_some() || 
        request.category.is_some() || 
        request.unit.is_some() || 
        request.min_quantity.is_some() || 
        request.status.is_some() || 
        request.location.is_some() || 
        request.supplier.is_some() || 
        request.cost.is_some();

    // If quantity changed, create a stock history record
    if new_quantity != current_quantity {
        let action = if new_quantity > current_quantity { "Stock In" } else { "Stock Out" };
        let quantity_change = (new_quantity - current_quantity).abs();
        
        // Determine the appropriate reason based on the action
        let notes = if new_quantity > current_quantity {
            request.stock_in_reason.clone().unwrap_or_else(|| "Stock added".to_string())
        } else {
            request.stock_out_reason.clone().unwrap_or_else(|| "Stock released".to_string())
        };
        
        let history = SupplyHistory {
            id: uuid::Uuid::new_v4().to_string(),
            supply_id: request.id.clone(),
            action: action.to_string(),
            quantity: quantity_change,
            previous_quantity: current_quantity,
            new_quantity: new_quantity,
            notes: Some(notes),
            user_id: user_id,
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        
        db.create_supply_history(&history).map_err(|e| format!("Failed to create history record: {}", e))?;
    }
    // If only item details changed (no quantity change), create an "Item Updated" history record
    else if item_details_changed {
        let history = SupplyHistory {
            id: uuid::Uuid::new_v4().to_string(),
            supply_id: request.id.clone(),
            action: "Item Updated".to_string(),
            quantity: 0,
            previous_quantity: current_quantity,
            new_quantity: current_quantity,
            notes: Some("Item details updated".to_string()),
            user_id: user_id,
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        
        db.create_supply_history(&history).map_err(|e| format!("Failed to create history record: {}", e))?;
    }
    
    Ok("Supply updated successfully".to_string())
}

#[tauri::command]
async fn get_supply_histories(state: State<'_, AppState>) -> Result<Vec<EnrichedSupplyHistory>, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    db.get_supply_histories().map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
async fn delete_supply(
    state: State<'_, AppState>,
    supply_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    db.delete_supply(&supply_id).map_err(|e| format!("Database error: {}", e))?;
    Ok("Supply deleted successfully".to_string())
}

#[tauri::command]
async fn delete_supply_history(
    state: State<'_, AppState>,
    history_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    db.delete_supply_history(&history_id).map_err(|e| format!("Database error: {}", e))?;
    Ok("Supply history deleted successfully".to_string())
}



fn main() {
    // Initialize database with optimizations
    let database = Database::new().expect("Failed to initialize database");
    let app_state = AppState {
        db: Mutex::new(database),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            login,
            get_users,
            create_user,
            update_user,
            get_supplies,
            create_supply,
            update_supply,
            get_supply_histories,
            delete_supply,
            delete_supply_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
