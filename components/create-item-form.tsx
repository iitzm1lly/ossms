"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import tauriApiService from "./services/tauriApiService"
import { getCategoryOptions } from "@/lib/category-utils"

// Form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  unit_type: z.string().min(1, { message: "Please select a unit type" }),
  pieces_per_bulk: z.coerce.number().int().min(1, { message: "Must be at least 1" }),
  initial_bulk: z.coerce.number().int().min(0, { message: "Cannot be negative" }),
  initial_pieces: z.coerce.number().int().min(0, { message: "Cannot be negative" }),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  supplier_name: z.string().optional(),
  supplier_contact: z.string().optional(),
  supplier_notes: z.string().optional(),
  stock_in_reason: z.string().min(1, { message: "Please provide a reason for initial stock" }),
})

type FormValues = z.infer<typeof formSchema>

// Define unit types
const unitTypes = [
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "ream", label: "Ream" },
  { value: "set", label: "Set" },
  { value: "roll", label: "Roll" },
  { value: "bottle", label: "Bottle" },
  { value: "carton", label: "Carton" },
]

// Helper function to get default pieces per bulk unit based on unit type
const getDefaultPiecesPerBulk = (unitType: string): number => {
  const unitTypeLower = unitType?.toLowerCase() || 'box'
  
  const defaultPiecesMap: Record<string, number> = {
    'box': 12,        // Standard box of pens, paper clips, etc.
    'pack': 10,       // Pack of markers, highlighters, etc.
    'ream': 500,      // Ream of paper (500 sheets)
    'set': 5,         // Set of items (staplers, scissors, etc.)
    'roll': 1,        // Roll of tape, paper towels, etc.
    'bottle': 1,      // Bottle of ink, cleaning supplies, etc.
    'carton': 24,     // Carton of items (larger than box)
    'unit': 1,        // Individual unit
    'piece': 1,       // Individual piece
    'item': 1,        // Individual item
  }
  
  return defaultPiecesMap[unitTypeLower] || 12 // Default fallback
}

export function CreateItemForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [subcategories, setSubcategories] = useState<Record<string, { value: string; label: string }[]>>({})
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Fetch categories from API or use local data
    const { categories: categoryOptions, subcategories: subcategoryOptions } = getCategoryOptions()
    setCategories(categoryOptions)
    setSubcategories(subcategoryOptions)
  }, [])

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      unit_type: "box",
      pieces_per_bulk: getDefaultPiecesPerBulk("box"),
      initial_bulk: 0,
      initial_pieces: 0,
      description: "",
      category: "",
      subcategory: "",
      supplier_name: "",
      supplier_contact: "",
      supplier_notes: "",
      stock_in_reason: "Initial stock",
    },
  })

  // Watch category to update subcategory options
  const watchCategory = form.watch("category")
  
  // Watch unit type to update pieces per bulk
  const watchUnitType = form.watch("unit_type")
  
  // Update pieces per bulk when unit type changes
  useEffect(() => {
    const currentUnitType = watchUnitType || "box"
    const defaultPieces = getDefaultPiecesPerBulk(currentUnitType)
    form.setValue("pieces_per_bulk", defaultPieces)
  }, [watchUnitType, form])

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate total pieces
      const totalPieces = data.initial_pieces + data.initial_bulk * data.pieces_per_bulk

      // Calculate stock status
      let stockStatus = "Moderate"
      if (totalPieces <= 24) {
        stockStatus = "Low"
      } else if (totalPieces >= 120) {
        stockStatus = "High"
      }

      // Get current user
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      // Prepare API payload
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category || "other",
        quantity: totalPieces,
        unit: data.unit_type,
        min_quantity: 10, // Default minimum quantity
        status: stockStatus,
        location: "Main Storage",
        supplier: data.supplier_name,
        cost: undefined,
      }

      // Make API request
      const response = await tauriApiService.createSupply(payload)

      if (response) {
        toast({
          title: "Success",
          description: "Item created successfully",
        })
        router.push("/inventory")
        router.refresh()
      } else {
        throw new Error("Failed to create item")
      }
    } catch (error: any) {
      console.error("Error creating item:", error)
      setError(error.message || "An unexpected error occurred")
      toast({
        title: "Error",
        description: error.message || "Failed to create item",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="details">Item Details</TabsTrigger>
              <TabsTrigger value="supplier">Supplier Information</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 pt-4">
              {/* Basic information fields */}
            </TabsContent>

            <TabsContent value="details" className="space-y-6 pt-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">ITEM DESCRIPTION</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-white min-h-[100px]"
                        placeholder="Enter detailed description of the item"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">CATEGORY</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories
                            .filter((category) => category.value !== "tech")
                            .map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">SUBCATEGORY</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchCategory}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder={watchCategory ? "Select subcategory" : "Select category first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {watchCategory &&
                            subcategories[watchCategory as keyof typeof subcategories]?.map((subcategory) => (
                              <SelectItem key={subcategory.value} value={subcategory.value}>
                                {subcategory.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="supplier" className="space-y-6 pt-4">
              {/* Supplier information fields */}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="px-6"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#b12025] hover:bg-[#b12025]/90 px-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Item"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

