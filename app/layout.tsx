import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import DevStorageClear from "../components/DevStorageClear";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Office Supplies Stock Monitoring System",
  description: "A system for monitoring office supplies stock"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
        <Toaster />
        <DevStorageClear />
      </body>
    </html>
  )
}

