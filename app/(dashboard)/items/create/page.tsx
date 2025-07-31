import type { Metadata } from "next"
import { CreateItemForm } from "@/components/create-item-form"

export const metadata: Metadata = {
  title: "Create Item | Office Supplies Management System",
  description: "Create a new inventory item",
}

export default function CreateItemPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Item</h1>
      </div>

      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <CreateItemForm />
      </div>
    </div>
  )
}

