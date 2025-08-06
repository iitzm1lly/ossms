// Define variations for different categories of office supplies
// This provides a structured way to classify items by their specific variations

export function getVariationOptions(category: string) {
  const variations = {
    writing: [
      { value: "ballpoint", label: "Ballpoint" },
      { value: "gel", label: "Gel" },
      { value: "fountain", label: "Fountain" },
      { value: "rollerball", label: "Rollerball" },
      { value: "felt_tip", label: "Felt Tip" },
      { value: "mechanical", label: "Mechanical" },
      { value: "wooden", label: "Wooden" },
      { value: "colored", label: "Colored" },
      { value: "permanent", label: "Permanent" },
      { value: "erasable", label: "Erasable" },
    ],
    paper: [
      { value: "a4", label: "A4 Size" },
      { value: "a3", label: "A3 Size" },
      { value: "letter", label: "Letter Size" },
      { value: "legal", label: "Legal Size" },
      { value: "colored", label: "Colored" },
      { value: "recycled", label: "Recycled" },
      { value: "glossy", label: "Glossy" },
      { value: "matte", label: "Matte" },
      { value: "lined", label: "Lined" },
      { value: "unlined", label: "Unlined" },
      { value: "grid", label: "Grid" },
      { value: "dot_grid", label: "Dot Grid" },
    ],
    filing: [
      { value: "letter_size", label: "Letter Size" },
      { value: "legal_size", label: "Legal Size" },
      { value: "a4_size", label: "A4 Size" },
      { value: "expanding", label: "Expanding" },
      { value: "hanging", label: "Hanging" },
      { value: "pocket", label: "Pocket" },
      { value: "tabbed", label: "Tabbed" },
      { value: "colored", label: "Colored" },
      { value: "transparent", label: "Transparent" },
      { value: "reinforced", label: "Reinforced" },
    ],
    desk: [
      { value: "desktop", label: "Desktop" },
      { value: "handheld", label: "Handheld" },
      { value: "electric", label: "Electric" },
      { value: "manual", label: "Manual" },
      { value: "heavy_duty", label: "Heavy Duty" },
      { value: "mini", label: "Mini" },
      { value: "standard", label: "Standard" },
      { value: "premium", label: "Premium" },
      { value: "ergonomic", label: "Ergonomic" },
    ],
    tech: [
      { value: "usb_2", label: "USB 2.0" },
      { value: "usb_3", label: "USB 3.0" },
      { value: "usb_c", label: "USB-C" },
      { value: "wireless", label: "Wireless" },
      { value: "wired", label: "Wired" },
      { value: "bluetooth", label: "Bluetooth" },
      { value: "rechargeable", label: "Rechargeable" },
      { value: "disposable", label: "Disposable" },
      { value: "high_capacity", label: "High Capacity" },
      { value: "standard_capacity", label: "Standard Capacity" },
    ],
    other: [
      { value: "concentrated", label: "Concentrated" },
      { value: "ready_to_use", label: "Ready to Use" },
      { value: "eco_friendly", label: "Eco-Friendly" },
      { value: "industrial", label: "Industrial" },
      { value: "office_grade", label: "Office Grade" },
      { value: "premium_quality", label: "Premium Quality" },
      { value: "budget", label: "Budget" },
      { value: "custom", label: "Custom" },
    ],
  }

  return variations[category as keyof typeof variations] || []
}

export function getVariationLabel(category: string, variation: string): string {
  const variations = getVariationOptions(category)
  const variationObj = variations.find(v => v.value === variation)
  return variationObj?.label || variation
}

export function getAllVariations() {
  return {
    writing: getVariationOptions("writing"),
    paper: getVariationOptions("paper"),
    filing: getVariationOptions("filing"),
    desk: getVariationOptions("desk"),
    tech: getVariationOptions("tech"),
    other: getVariationOptions("other"),
  }
} 