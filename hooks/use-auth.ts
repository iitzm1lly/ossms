"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import tauriApiService from "@/components/services/tauriApiService"

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem("user")
      const isLoggedInStr = localStorage.getItem("isLoggedIn")
      
      if (userStr && isLoggedInStr === "true") {
        try {
          const userData = JSON.parse(userStr)
          
          // Ensure permissions are properly formatted
          if (userData.permissions && typeof userData.permissions === 'string') {
            try {
              userData.permissions = JSON.parse(userData.permissions)
              // Update localStorage with parsed permissions
              localStorage.setItem("user", JSON.stringify(userData))
            } catch (error) {
              userData.permissions = {}
            }
          }
          
          setUser(userData)
          setIsLoggedIn(true)
        } catch (error) {
          localStorage.removeItem("user")
          localStorage.removeItem("isLoggedIn")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const res = await tauriApiService.login(username, password)
      
      if (res.success && res.user) {
        // Ensure permissions are properly formatted
        let userData = { ...res.user }
        
        // Parse permissions if they're stored as a string
        if (userData.permissions && typeof userData.permissions === 'string') {
          try {
            userData.permissions = JSON.parse(userData.permissions)
          } catch (error) {
            userData.permissions = {}
          }
        }
        
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("justLoggedIn", "true")
        setUser(userData)
        setIsLoggedIn(true)
        return { success: true }
      } else {
        return { success: false, error: res.error || "Login failed" }
      }
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" }
    }
  }

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("justLoggedIn")
    setUser(null)
    setIsLoggedIn(false)
    router.push("/")
  }

  return {
    isLoggedIn,
    user,
    isLoading,
    login,
    logout,
  }
}

