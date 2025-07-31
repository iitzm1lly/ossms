"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, Mail, CheckCircle, Building2, Shield } from "lucide-react"
import tauriApiService from "@/components/services/tauriApiService"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [resetToken, setResetToken] = useState("")
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
        toast({
          title: "Success!",
          description: "Password reset link has been sent to your email",
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
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">
                  Check Your Email
                </h3>
                <p className="text-gray-300">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>

              {/* Development Only - Show Token */}
              {process.env.NODE_ENV === 'development' && resetToken && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Development Token (remove in production):</p>
                  <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                    {resetToken}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleBackToLogin}
                  className="w-full bg-[#b12025] hover:bg-[#8a1a1f] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-[#b12025]/20"
                >
                  Back to Login
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSuccess(false)
                    setEmail("")
                    setResetToken("")
                  }}
                  className="w-full border-gray-300 text-gray-300 hover:bg-gray-600"
                >
                  Send Another Link
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