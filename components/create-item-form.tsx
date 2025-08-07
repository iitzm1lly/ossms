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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import tauriApiService from "./services/tauriApiService"
import { getCategoryOptions } from "@/lib/category-utils"
import { getVariationOptions } from "@/lib/variation-utils"
import { calculateStockStatus } from "@/lib/utils"

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
  variation: z.string().optional(),
  brand: z.string().min(1, { message: "Brand name is required" }),
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
      variation: "",
      brand: "",
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

      // Calculate stock status using consistent logic
      const stockStatus = calculateStockStatus(totalPieces, 10).status

      // Get current user
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      // Prepare API payload
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category || "other",
        subcategory: data.subcategory,
        variation: data.variation,
        brand: data.brand,
        quantity: totalPieces,
        unit: data.unit_type,
        min_quantity: 10, // Default minimum quantity
        status: stockStatus,
        location: "Main Storage",
        supplier: data.supplier_name,
        supplier_name: data.supplier_name,
        supplier_contact: data.supplier_contact,
        supplier_notes: data.supplier_notes,
        pieces_per_bulk: data.pieces_per_bulk,
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="basic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Basic Information
              </TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Item Details
              </TabsTrigger>
              <TabsTrigger value="supplier" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Supplier Information
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Item Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                          placeholder="Enter item name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Unit Type
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors">
                            <SelectValue placeholder="Select unit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitTypes.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="initial_bulk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Initial Bulk Units
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pieces_per_bulk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Pieces Per Bulk
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                          placeholder="12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initial_pieces"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Additional Pieces
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="stock_in_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Stock In Reason
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                        placeholder="Enter reason for initial stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="details" className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Item Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors min-h-[100px]"
                        placeholder="Enter detailed description of the item"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Category
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors">
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
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Subcategory
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchCategory}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="variation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Variation
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchCategory}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors">
                            <SelectValue placeholder={watchCategory ? "Select variation" : "Select category first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {watchCategory &&
                            getVariationOptions(watchCategory).map((variation) => (
                              <SelectItem key={variation.value} value={variation.value}>
                                {variation.label}
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
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Brand
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                          placeholder="Enter brand name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="supplier" className="space-y-6 pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="supplier_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Supplier Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                          placeholder="Enter supplier name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplier_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Supplier Contact
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                          placeholder="Enter contact information"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplier_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Supplier Notes
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors"
                          placeholder="Enter additional notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="px-6 border-gray-200 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#b12025] hover:bg-[#8a1a1f] text-white px-6 transition-colors" 
              disabled={isSubmitting}
            >
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

