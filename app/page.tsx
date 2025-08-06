"use client"
import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, Shield, Lock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import tauriApiService from "@/components/services/tauriApiService"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [errors, setErrors] = useState({ username: "", password: "" })
  const router = useRouter()
  const { toast } = useToast()

  // Initialize Tauri API service on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Reduced wait time for faster initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Test if Tauri is available by checking database status
        await tauriApiService.checkDatabaseStatus();
        
        setIsInitializing(false);
      } catch (error) {
        // Still allow the form to be shown even if Tauri is not available
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const response = await tauriApiService.login(formData.username, formData.password)
      
      if (response.success && response.user) {
        // Store auth data
        localStorage.setItem("user", JSON.stringify(response.user))
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("justLoggedIn", "true")

        toast({
          title: "Login successful",
          description: "Welcome back!",
        })

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        setErrors({ general: response.error || "Login failed" })
      }
    } catch (error: any) {
      setErrors({ general: error.message || "An error occurred during login" })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading spinner while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Image with Blur */}
        <div className="absolute inset-0">
          <Image
            src="/background.jpg"
            alt="Background"
            fill
            className="object-cover blur-sm"
            priority
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5dc]/90 via-[#e8e4c9]/85 to-[#d4cfb4]/80"></div>
        
        {/* Loading Content */}
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <Loader2 className="w-full h-full animate-spin text-[#b12025]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing Application</h2>
          <p className="text-gray-600">Please wait while we set up your environment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Blur */}
      <div className="absolute inset-0">
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover blur-sm"
          priority
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5dc]/90 via-[#e8e4c9]/85 to-[#d4cfb4]/80"></div>
      
      {/* Additional Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#b12025]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#4c4a4a]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#b12025]/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #b12025 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
      </div>

      {/* UST Logo - Top Left */}
      <div className="absolute top-6 left-6 z-20 group">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full p-3 shadow-2xl border-2 border-blue-200 flex items-center justify-center hover:shadow-3xl transition-all duration-500 hover:scale-110 group-hover:border-[#b12025]/20">
          <Image
            src="/ust-logo.png"
            alt="UST Logo"
            width={91}
            height={91}
            className="w-23 h-23 object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-500 -ml-1 -mt-2"
            priority
          />
        </div>
      </div>

      {/* CICS Logo - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-20 group">
        <div className="w-32 h-32 bg-gradient-to-br from-[#4c4a4a] to-[#3a3838] rounded-full p-2 shadow-2xl border-2 border-gray-600 flex items-center justify-center hover:shadow-3xl transition-all duration-500 hover:scale-110 group-hover:border-[#b12025]/20">
          <Image
            src="/ciscs-logo.png"
            alt="CICS Logo"
            width={112}
            height={112}
            className="w-28 h-28 object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-500 -mt-3"
            priority
          />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 tracking-wider leading-tight">
            OFFICE SUPPLIES STOCK MONITORING SYSTEM
          </h1>
          <p className="text-gray-600 text-base font-semibold tracking-wide">
            UST CICS OFFICE
          </p>
        </div>

        {/* Login Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#4c4a4a] to-[#3a3838] rounded-3xl shadow-2xl border border-gray-600/50 p-10 backdrop-blur-sm"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="w-12 h-12 bg-[#b12025]/20 rounded-full flex items-center justify-center mr-3">
                <Lock className="w-6 h-6 text-[#b12025]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">Credentials</h3>
            <p className="text-gray-300 text-sm font-medium">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-3">
              <Label htmlFor="username" className="text-sm font-semibold text-white tracking-wide">
                USERNAME
              </Label>
              <div className="relative group">
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-[#b12025]/20 focus:border-[#b12025] bg-white/95 text-black placeholder-gray-500 font-medium ${
                    errors.username ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter your username"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-1 h-6 bg-[#b12025]/30 rounded-full"></div>
                </div>
              </div>
              {errors.username && (
                <p className="text-sm text-red-300 flex items-center animate-pulse">
                  <span className="w-1.5 h-1.5 bg-red-300 rounded-full mr-2"></span>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-white tracking-wide">
                PASSWORD
              </Label>
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  className={`w-full px-4 py-4 pr-12 border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-[#b12025]/20 focus:border-[#b12025] bg-white/95 text-black placeholder-gray-500 font-medium [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                    errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-1 h-6 bg-[#b12025]/30 rounded-full"></div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-md hover:bg-gray-100 z-10"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-300 flex items-center animate-pulse">
                  <span className="w-1.5 h-1.5 bg-red-300 rounded-full mr-2"></span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-300 rounded-full mr-2"></span>
                  {errors.general}
                </p>
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link href="/forgot-password">
                <button
                  type="button"
                  className="text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot Password?
                </button>
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#b12025] to-[#8a1a1f] hover:from-[#8a1a1f] hover:to-[#6d1519] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-[#b12025]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  LOGGING IN...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Shield className="mr-2 h-5 w-5" />
                  LOG IN
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              Secure access to the Office Supplies Management System
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

