// Prevents additional console window on Windows, DO NOT REMOVE!!
// #![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

mod database;

use database::{Database, User, Supply, SupplyHistory, EnrichedSupplyHistory, UpdateSupplyRequest};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use lettre::{Message, SmtpTransport, Transport};
use lettre::transport::smtp::authentication::Credentials;
use rand::Rng;
use uuid::Uuid;

// ============================================================================
// EMAIL CONFIGURATION - UPDATE THESE VALUES FOR YOUR EMAIL SETUP
// ============================================================================
// 
// To set up email password reset functionality:
// 1. Replace "your-email@gmail.com" with your actual Gmail address
// 2. Replace "your-app-password" with your Gmail App Password
// 3. Make sure 2-Factor Authentication is enabled on your Gmail account
// 4. Generate an App Password from Google Account settings
//
// Example:
// const SMTP_EMAIL: &str = "admin@ust.edu.ph";
// const SMTP_PASSWORD: &str = "abcd efgh ijkl mnop";
//
// ============================================================================

// Hardcoded email configuration
const SMTP_EMAIL: &str = "jaisenmillard.villegas.cics@ust.edu.ph";  // Replace with your email
const SMTP_PASSWORD: &str = "jdyivmsvifidepgd";  // Replace with your app password

// App state with connection pooling
struct AppState {
    db: Mutex<Database>,
}

#[derive(Serialize, Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Serialize, Deserialize)]
struct LoginResponse {
    success: bool,
    user: Option<User>,
    error: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct CreateUserRequest {
    username: String,
    password: String,
    firstname: String,
    lastname: String,
    email: String,
    role: String,
    permissions: String,
}

#[derive(Serialize, Deserialize)]
struct CreateSupplyRequest {
    name: String,
    description: Option<String>,
    category: String,
    subcategory: Option<String>,
    variation: Option<String>,
    brand: Option<String>,
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

#[derive(Serialize, Deserialize)]
struct ForgotPasswordRequest {
    email: String,
}

#[derive(Serialize, Deserialize)]
struct ResetPasswordRequest {
    email: String,
    token: String,
    password: String,
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
    user_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Get current user from the passed user_id
    let current_user = db.get_user_by_id(&user_id).map_err(|e| format!("Failed to get current user: {}", e))?;
    let user_id_for_history = if let Some(user) = current_user {
        user.id
    } else {
        return Err("Current user not found".to_string());
    };
    
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
    
    db.create_user(&user, &user_id_for_history).map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
async fn update_user(
    state: State<'_, AppState>,
    request: database::UpdateUserRequest,
    user_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Get current user from the passed user_id
    let current_user = db.get_user_by_id(&user_id).map_err(|e| format!("Failed to get current user: {}", e))?;
    let user_id_for_history = if let Some(user) = current_user {
        user.id
    } else {
        return Err("Current user not found".to_string());
    };
    
    // Update the user directly by ID
    db.update_user(&request.id, &request, &user_id_for_history).map_err(|e| format!("Database error: {}", e))?;
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
    user_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Get current user from the passed user_id
    let current_user = db.get_user_by_id(&user_id).map_err(|e| format!("Failed to get current user: {}", e))?;
    let user_id_for_history = if let Some(user) = current_user {
        user.id
    } else {
        return Err("Current user not found".to_string());
    };
    
    let supply = Supply {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        description: request.description,
        category: request.category,
        subcategory: request.subcategory,
        variation: request.variation,
        brand: request.brand,
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
    
    db.create_supply(&supply, &user_id_for_history).map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
async fn update_supply(
    state: State<'_, AppState>,
    request: UpdateSupplyRequest,
    user_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Get current user from the passed user_id
    let current_user = db.get_user_by_id(&user_id).map_err(|e| format!("Failed to get current user: {}", e))?;
    let user_id_for_history = if let Some(user) = current_user {
        user.id
    } else {
        return Err("Current user not found".to_string());
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
        request.subcategory.is_some() ||
        request.variation.is_some() ||
        request.brand.is_some() ||
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
            user_id: user_id_for_history,
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
            user_id: user_id_for_history,
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
    user_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    db.delete_supply(&supply_id, &user_id).map_err(|e| format!("Database error: {}", e))?;
    Ok("Supply deleted successfully".to_string())
}

#[tauri::command]
async fn delete_supply_history(
    state: State<'_, AppState>,
    history_id: String,
    user_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Get current user from the passed user_id
    let current_user = db.get_user_by_id(&user_id).map_err(|e| format!("Failed to get current user: {}", e))?;
    let user_id_for_history = if let Some(user) = current_user {
        user.id
    } else {
        return Err("Current user not found".to_string());
    };
    
    db.delete_supply_history(&history_id, &user_id_for_history).map_err(|e| format!("Database error: {}", e))?;
    Ok("Supply history deleted successfully".to_string())
}

#[derive(Serialize, Deserialize)]
struct ForgotPasswordResponse {
    success: bool,
    error: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct ResetPasswordResponse {
    success: bool,
    error: Option<String>,
}

#[tauri::command]
async fn forgot_password(
    state: State<'_, AppState>,
    request: ForgotPasswordRequest,
) -> Result<ForgotPasswordResponse, String> {
    // Debug logging removed for production
    
    // First, get the user and create the token while holding the lock
    let (user, token) = {
        let db = state.db.lock().map_err(|_| "Database lock failed")?;
        
        // Clean up expired tokens first
        db.cleanup_expired_tokens().map_err(|e| format!("Failed to cleanup tokens: {}", e))?;
        
        // Check if user exists with the provided email
        match db.get_user_by_email(&request.email) {
            Ok(Some(user)) => {
                // Generate a reset token
                let token = generate_reset_token();
                
                // Set expiration to 1 hour from now
                let expires_at = chrono::Utc::now() + chrono::Duration::hours(1);
                let expires_at_str = expires_at.to_rfc3339();
                
                // Store the token in the database
                db.create_password_reset_token(&user.id, &token, &expires_at_str)
                    .map_err(|e| format!("Failed to create reset token: {}", e))?;
                
                Ok::<(database::User, String), String>((user, token))
            }
            Ok(None) => {
                return Ok(ForgotPasswordResponse { 
                    success: false, 
                    error: Some("No user found with this email address".to_string()) 
                });
            }
            Err(e) => {
                return Ok(ForgotPasswordResponse { 
                    success: false, 
                    error: Some(format!("Database error: {}", e)) 
                });
            }
        }
    }?;
    
    // Now send the email without holding the database lock
    send_reset_email(&request.email, &token, &user.username)
        .await
        .map_err(|e| format!("Failed to send email: {}", e))?;
    
    Ok(ForgotPasswordResponse { 
        success: true, 
        error: None 
    })
}

#[tauri::command]
async fn reset_password(
    state: State<'_, AppState>,
    request: ResetPasswordRequest,
) -> Result<ResetPasswordResponse, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Validate the reset token
    let token_data = db.get_password_reset_token(&request.token)
        .map_err(|e| format!("Failed to get token: {}", e))?;
    
    match token_data {
        Some(token) => {
            // Check if token is expired
            let now = chrono::Utc::now();
            let expires_at = chrono::DateTime::parse_from_rfc3339(&token.expires_at)
                .map_err(|e| format!("Invalid token expiration date: {}", e))?;
            
            if now > expires_at {
                return Ok(ResetPasswordResponse { 
                    success: false, 
                    error: Some("Reset token has expired".to_string()) 
                });
            }
            
            // Check if token is already used
            if token.used {
                return Ok(ResetPasswordResponse { 
                    success: false, 
                    error: Some("Reset token has already been used".to_string()) 
                });
            }
            
            // Verify the email matches the token's user
            let user = db.get_user_by_email(&request.email)
                .map_err(|e| format!("Failed to get user: {}", e))?;
            
            match user {
                Some(user) => {
                    if user.id != token.user_id {
                        return Ok(ResetPasswordResponse { 
                            success: false, 
                            error: Some("Invalid token for this email address".to_string()) 
                        });
                    }
                    
                    // Hash the new password
                    let hashed_password = bcrypt::hash(&request.password, bcrypt::DEFAULT_COST)
                        .map_err(|e| format!("Password hashing error: {}", e))?;
                    
                    // Update the user's password
                    db.update_user_password(&user.id, &hashed_password)
                        .map_err(|e| format!("Failed to update password: {}", e))?;
                    
                    // Mark the token as used
                    db.mark_token_as_used(&request.token)
                        .map_err(|e| format!("Failed to mark token as used: {}", e))?;
                    
                    Ok(ResetPasswordResponse { 
                        success: true, 
                        error: None 
                    })
                }
                None => {
                    Ok(ResetPasswordResponse { 
                        success: false, 
                        error: Some("No user found with this email address".to_string()) 
                    })
                }
            }
        }
        None => {
            Ok(ResetPasswordResponse { 
                success: false, 
                error: Some("Invalid or expired reset token".to_string()) 
            })
        }
    }
}

#[tauri::command]
async fn delete_user(
    state: State<'_, AppState>,
    user_id: String,
    current_user_id: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    // Get current user from the passed current_user_id
    let current_user = db.get_user_by_id(&current_user_id).map_err(|e| format!("Failed to get current user: {}", e))?;
    let user_id_for_history = if let Some(user) = current_user {
        user.id
    } else {
        return Err("Current user not found".to_string());
    };
    
    // In a real application, you might want to:
    // 1. Check if user exists
    // 2. Check if user has any associated data
    // 3. Soft delete instead of hard delete
    
    // For now, we'll just delete the user
    db.delete_user(&user_id, &user_id_for_history).map_err(|e| format!("Database error: {}", e))?;
    Ok("User deleted successfully".to_string())
}

#[tauri::command]
async fn recalculate_stock_status(state: State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Database lock failed")?;
    
    match db.recalculate_all_stock_status() {
        Ok(_) => Ok("Stock status recalculated successfully".to_string()),
        Err(e) => Err(format!("Failed to recalculate stock status: {}", e)),
    }
}



#[tauri::command]
async fn get_version() -> Result<String, String> {
    Ok("1.0.0".to_string())
}

#[tauri::command]
async fn get_name() -> Result<String, String> {
    Ok("OSSMS Desktop".to_string())
}

// Helper function to generate a random token
fn generate_reset_token() -> String {
    let mut rng = rand::thread_rng();
    let token: String = (0..32)
        .map(|_| rng.sample(rand::distributions::Alphanumeric) as char)
        .collect();
    token
}

// Helper function to send email
async fn send_reset_email(email: &str, token: &str, username: &str) -> Result<(), String> {
    let email_body = format!(
        "Hello {},\n\nYou have requested a password reset for your OSSMS account.\n\nYour reset token is: {}\n\nThis token will expire in 1 hour.\n\nIf you did not request this reset, please ignore this email.\n\nBest regards,\nOSSMS Team",
        username, token
    );

    let email_message = Message::builder()
        .from("noreply@ossms.com".parse().unwrap())
        .to(email.parse().unwrap())
        .subject("OSSMS Password Reset")
        .body(email_body)
        .map_err(|e| format!("Failed to create email: {}", e))?;

    // Use hardcoded credentials for easier setup
    let creds = Credentials::new(SMTP_EMAIL.to_string(), SMTP_PASSWORD.to_string());
    
    let mailer = SmtpTransport::relay("smtp.gmail.com")
        .unwrap()
        .credentials(creds)
        .build();

    mailer.send(&email_message)
        .map_err(|e| format!("Failed to send email: {}", e))?;

    Ok(())
}

fn main() {
    println!("Starting OSSMS Desktop application...");
    
    // Initialize database with optimizations
    println!("Initializing database...");
    let database = match Database::new() {
        Ok(db) => {
            println!("Database initialized successfully");
            db
        },
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            std::process::exit(1);
        }
    };
    
    println!("Setting up app state...");
    let app_state = AppState {
        db: Mutex::new(database),
    };

    println!("Starting Tauri application...");
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            login,
            get_users,
            create_user,
            update_user,
            delete_user,
    
            get_supplies,
            create_supply,
            update_supply,
            get_supply_histories,
            delete_supply,
            delete_supply_history,
            recalculate_stock_status,
            forgot_password,
            reset_password,
            get_version,
            get_name,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
