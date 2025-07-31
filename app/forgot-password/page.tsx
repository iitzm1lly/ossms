"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, Mail, CheckCircle, Building2, Shield, Eye, EyeOff } from "lucide-react"
import tauriApiService from "@/components/services/tauriApiService"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    // Validate email
    if (!email.trim()) {
      setErrors({ email: "Email is required" })
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrors({ email: "Please enter a valid email address" })
      return
    }

    setIsLoading(true)

    try {
      const response = await tauriApiService.forgotPassword(email.trim())

      if (response && response.success) {
        setIsSuccess(true)
        setShowResetForm(true)
        toast({
          title: "Success!",
          description: "Password reset email sent! You can now reset your password below.",
        })
      } else {
        throw new Error(response?.error || "Failed to send reset link")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/")
  }

  const validateResetForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!resetToken.trim()) newErrors.token = "Reset token is required"
    if (!newPassword.trim()) newErrors.password = "New password is required"
    if (!confirmPassword.trim()) newErrors.confirmPassword = "Password confirmation is required"
    
    // Password validation
    if (newPassword && newPassword.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    // Password confirmation validation
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateResetForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsResetting(true)

    try {
      const response = await tauriApiService.resetPassword(
        email.trim(),
        resetToken.trim(),
        newPassword
      )

      if (response && response.success) {
        toast({
          title: "Success!",
          description: "Your password has been reset successfully. You can now login with your new password.",
        })
        // Reset form and go back to login
        setShowResetForm(false)
        setResetToken("")
        setNewPassword("")
        setConfirmPassword("")
        setIsSuccess(false)
        setEmail("")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else {
        throw new Error(response?.error || "Failed to reset password")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
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
      
      {/* UST Logo - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-20 group">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full p-2 shadow-2xl border-2 border-blue-200 flex items-center justify-center hover:shadow-3xl transition-all duration-500 hover:scale-110 group-hover:border-[#b12025]/20">
          <Image
            src="/ust-logo.png"
            alt="UST Logo"
            width={72}
            height={72}
            className="w-18 h-18 object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-500 -ml-1 -mt-2"
            priority
          />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[#4c4a4a] rounded-xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div className="p-3 bg-[#b12025] rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            OFFICE SUPPLIES STOCK MONITORING SYSTEM
          </h1>
          <p className="text-gray-600 text-sm">
            UST CICS OFFICE
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-[#4c4a4a] rounded-2xl shadow-2xl border border-gray-600 p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Forgot Password?</h3>
            <p className="text-gray-300">Enter your email address and we'll send you a link to reset your password</p>
          </div>

          {/* Back to Login Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToLogin}
              className="flex items-center space-x-2 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Button>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">
                  EMAIL ADDRESS*
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#b12025]/20 focus:border-[#b12025] bg-white text-black ${
                    errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                  placeholder="REQUIRED FIELD"
                  required
                />
                {errors.email && (
                  <p className="text-sm text-yellow-300 flex items-center">
                    <span className="w-1 h-1 bg-yellow-300 rounded-full mr-2"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#b12025] hover:bg-[#8a1a1f] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-[#b12025]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    SENDING RESET LINK...
                  </div>
                ) : (
                  "SEND RESET LINK"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                
                <div className="space-y-2 mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Email Sent Successfully!
                  </h3>
                  <p className="text-gray-300">
                    We've sent a password reset email to <strong>{email}</strong>
                  </p>
                  <p className="text-gray-300 text-sm">
                    Copy the token from your email and reset your password below:
                  </p>
                </div>
              </div>

              {/* Password Reset Form */}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-sm font-medium text-white">
                    RESET TOKEN*
                  </Label>
                  <Input
                    type="text"
                    id="token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#b12025]/20 focus:border-[#b12025] bg-white text-black ${
                      errors.token ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                    }`}
                    placeholder="Paste the token from your email"
                    required
                  />
                  {errors.token && (
                    <p className="text-sm text-yellow-300 flex items-center">
                      <span className="w-1 h-1 bg-yellow-300 rounded-full mr-2"></span>
                      {errors.token}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-white">
                    NEW PASSWORD*
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#b12025]/20 focus:border-[#b12025] bg-white text-black ${
                        errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                      }`}
                      placeholder="Enter new password (min 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-yellow-300 flex items-center">
                      <span className="w-1 h-1 bg-yellow-300 rounded-full mr-2"></span>
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                    CONFIRM PASSWORD*
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#b12025]/20 focus:border-[#b12025] bg-white text-black ${
                        errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-yellow-300 flex items-center">
                      <span className="w-1 h-1 bg-yellow-300 rounded-full mr-2"></span>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#b12025] hover:bg-[#8a1a1f] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-[#b12025]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      RESETTING PASSWORD...
                    </div>
                  ) : (
                    "RESET PASSWORD"
                  )}
                </Button>
              </form>

              <div className="space-y-3">
                <Button
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-300 hover:bg-gray-600"
                >
                  Back to Login
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSuccess(false)
                    setShowResetForm(false)
                    setEmail("")
                    setResetToken("")
                    setNewPassword("")
                    setConfirmPassword("")
                  }}
                  className="w-full border-gray-300 text-gray-300 hover:bg-gray-600"
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-300">
              Secure access to the Office Supplies Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 