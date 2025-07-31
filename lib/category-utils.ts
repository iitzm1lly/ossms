// Define categories and subcategories for the entire application
// This centralizes category management to ensure consistency across components

export function getCategoryOptions() {
  // Define categories
  const categories = [
    { value: "writing", label: "Writing Instruments" },
    { value: "paper", label: "Paper Products" },
    { value: "filing", label: "Filing & Storage" },
    { value: "desk", label: "Desk Accessories" },
    { value: "other", label: "Other" },
  ]

  // Define subcategories based on parent category
  const subcategories = {
    writing: [
      { value: "pens", label: "Pens" },
      { value: "pencils", label: "Pencils" },
      { value: "markers", label: "Markers" },
      { value: "highlighters", label: "Highlighters" },
    ],
    paper: [
      { value: "bond_paper", label: "Bond Paper" },
      { value: "notebooks", label: "Notebooks" },
      { value: "sticky_notes", label: "Sticky Notes" },
      { value: "specialty_paper", label: "Specialty Paper" },
    ],
    filing: [
      { value: "folders", label: "Folders" },
      { value: "binders", label: "Binders" },
      { value: "clips", label: "Clips & Fasteners" },
      { value: "storage_boxes", label: "Storage Boxes" },
    ],
    desk: [
      { value: "staplers", label: "Staplers" },
      { value: "tape", label: "Tape & Adhesives" },
      { value: "scissors", label: "Scissors" },
      { value: "organizers", label: "Desk Organizers" },
    ],
    other: [
      { value: "cleaning", label: "Cleaning Supplies" },
      { value: "misc", label: "Miscellaneous" },
    ],
    // Keep tech subcategories for backward compatibility with existing items
    tech: [
      { value: "usb_drives", label: "USB Drives" },
      { value: "cables", label: "Cables" },
      { value: "peripherals", label: "Computer Peripherals" },
      { value: "batteries", label: "Batteries" },
    ],
  }

  return { categories, subcategories }
}

// Helper function to handle legacy technology category items
export function getLegacyCategoryLabel(categoryValue: string): string {
  return categoryValue
}

// Helper function to get subcategory label
export function getSubcategoryLabel(categoryValue: string, subcategoryValue: string): string {
  const { subcategories } = getCategoryOptions()

  if (categoryValue && subcategoryValue) {
    const subcategoryList = subcategories[categoryValue as keyof typeof subcategories] || []
    const subcategoryObj = subcategoryList.find((subcat) => subcat.value === subcategoryValue)
    return subcategoryObj?.label || subcategoryValue
  }

  return subcategoryValue
}

