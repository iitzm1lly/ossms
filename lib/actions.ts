"use server"

import { revalidatePath } from "next/cache"
import { mockItems, mockItemHistory, mockUsers } from "./mock-data"
import apiService from "@/components/services/apiService"

// MOCK DATA STORE
// This will simulate a database in memory during the session
const items = [...mockItems]
const itemHistory = [...mockItemHistory]
const users = [...mockUsers]

// INVENTORY ACTIONS
export async function getItems() {
  return items
}

export async function getItem(id: number) {
  return items.find((item) => item.id === id) || null
}

export const addItem = async (itemData: any) => {
  try {
    const response = await apiService.post("/create-item", itemData)
    return { success: true, data: response.data }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message }
  }
}

export const updateItem = async (id: number, itemData: any) => {
  try {
    const response = await apiService.put(`/update-item/${id}`, itemData)
    return { success: true, data: response.data }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message }
  }
}

export const updateItemStock = async (id: number, stockData: any) => {
  try {
    const response = await apiService.put(`/update-item/${id}`, stockData)
    return { success: true, data: response.data }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message }
  }
}

// ITEM HISTORY ACTIONS
export async function getItemHistory() {
  return itemHistory
}

// USER ACTIONS
export const getUsers = async () => {
  try {
    const response = await apiService.get("/users")
    return { success: true, data: response.data.users }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message }
  }
}

export const createUser = async (userData: {
  firstname: string
  lastname: string
  username: string
  email: string
  password: string
  role: string
  permissions: any
}) => {
  try {
    const response = await apiService.post("/add-user", userData)
    return { success: true, data: response.data }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message }
  }
}

export const updateUser = async (id: number, userData: any) => {
  try {
    const response = await apiService.put(`/update-user/${id}`, userData)
    return { success: true, data: response.data }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message }
  }
}

// AUTH ACTIONS
export const signIn = async (credentials: { username: string; password: string }) => {
  try {
    const response = await apiService.post("/login", credentials)
    return { success: true, data: response.data }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message }
  }
}

export async function signOut() {
  // In a real app, this would invalidate the session
  return { success: true }
}

