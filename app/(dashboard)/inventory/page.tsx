import { ItemsTable } from "@/components/items-table"

export default function InventoryPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>
      <ItemsTable />
    </div>
  )
}

