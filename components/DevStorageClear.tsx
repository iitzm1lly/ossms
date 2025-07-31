"use client";
import { useEffect } from "react";

export default function DevStorageClear() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const clearStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
      };
      window.addEventListener("beforeunload", clearStorage);
      return () => window.removeEventListener("beforeunload", clearStorage);
    }
  }, []);
  return null;
} 