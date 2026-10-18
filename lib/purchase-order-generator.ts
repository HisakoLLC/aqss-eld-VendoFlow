import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import type { Purchase, PurchaseItem } from "@/components/purchases/purchases-data-provider"

export type StoreInfo = {
  name: string
  address: string
  phone: string
  email: string
}

export const DEFAULT_STORE_INFO: StoreInfo = {
  name: "AQSS Flow Limited",
  address: "Eastleigh, Nairobi, Kenya",
  phone: "+254 799 964 646",
  email: "aqssflow@gmail.com",
}

export async function getStoreInfo(): Promise<StoreInfo> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        return {
          name: data.name || DEFAULT_STORE_INFO.name,
          address: data.address || DEFAULT_STORE_INFO.address,
          phone: data.phone || DEFAULT_STORE_INFO.phone,
          email: data.email || DEFAULT_STORE_INFO.email,
        }
      }
    } catch (e) {
      console.warn("Failed to fetch store settings for PO, using defaults:", e)
    }
  }
  return DEFAULT_STORE_INFO
}

export type PurchaseOrderPDFOptions = {
  purchase: Purchase
  items: PurchaseItem[]
  storeInfo?: Partial<StoreInfo>
}

/**
 * Generates a professional Purchase Order PDF document.
 */
export async function generatePurchaseOrderPDF({
  purchase,
  items,
  storeInfo: customStoreInfo,
}: PurchaseOrderPDFOptions): Promise<Blob> {
  // Merge store info
  let resolvedStore = DEFAULT_STORE_INFO
  if (!customStoreInfo && typeof window !== "undefined") {
    try {
      resolvedStore = await getStoreInfo()
    } catch {
      resolvedStore = DEFAULT_STORE_INFO
    }
  }
  const store: StoreInfo = {
    ...resolvedStore,
    ...customStoreInfo,
  }

  // Standard A4 dimensions in mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth() // 210mm
  const pageHeight = doc.internal.pageSize.getHeight() // 297mm
  const margin = 14
  const contentWidth = pageWidth - margin * 2 // 182mm

  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42] // Slate 900
  const secondaryColor: [number, number, number] = [71, 85, 105] // Slate 600
  const accentColor: [number, number, number] = [16, 185, 129] // Emerald 500
  const lightBg: [number, number, number] = [248, 250, 252] // Slate 50
  const borderColor: [number, number, number] = [226, 232, 240] // Slate 200

  // Status Colors
  const statusStr = (purchase.payment_status || "Paid").trim()
  const statusLower = statusStr.toLowerCase()
  let statusBg: [number, number, number] = [220, 252, 231] // Green 100
  let statusText: [number, number, number] = [21, 128, 61] // Green 700
  let statusLabel = "PAID"

  if (statusLower.includes("unpaid")) {
    statusBg = [254, 226, 226] // Red 100
    statusText = [185, 28, 28] // Red 700
    statusLabel = "UNPAID"
  } else if (statusLower.includes("part")) {
    statusBg = [254, 243, 199] // Amber 100
    statusText = [180, 83, 9] // Amber 700
    statusLabel = "PARTIALLY PAID"
  } else if (statusLower.includes("credit")) {
    statusBg = [224, 231, 255] // Indigo 100
    statusText = [67, 56, 202] // Indigo 700
    statusLabel = "ON CREDIT"
  } else if (statusLower.includes("agree")) {
    statusBg = [243, 232, 255] // Purple 100
    statusText = [126, 34, 206] // Purple 700
    statusLabel = "CREDIT AGREEMENT"
  } else {
    statusBg = [220, 252, 231]
    statusText = [21, 128, 61]
    statusLabel = "FULLY PAID"
  }

  let y = margin

  // ─── 1. Header: Brand & PO Title ─────────────────────────────────
  // Store details (Left)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(...primaryColor)
  doc.text(store.name, margin, y + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...secondaryColor)
  doc.text(store.address, margin, y + 10)
  doc.text(`Phone: ${store.phone}  |  Email: ${store.email}`, margin, y + 14.5)

  // PO Title & Ref (Right)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...primaryColor)
  const poTitle = "PURCHASE ORDER"
  const poTitleW = (doc.getStringUnitWidth(poTitle) * 18) / doc.internal.scaleFactor
  doc.text(poTitle, pageWidth - margin - poTitleW, y + 5)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...accentColor)
  const refText = `Ref #${purchase.reference_number}`
  const refW = (doc.getStringUnitWidth(refText) * 10) / doc.internal.scaleFactor
  doc.text(refText, pageWidth - margin - refW, y + 10.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...secondaryColor)
  let dateFormatted = "N/A"
  try {
    dateFormatted = format(new Date(purchase.purchase_date), "MMMM dd, yyyy")
  } catch {
    dateFormatted = purchase.purchase_date || "N/A"
  }
  const dateText = `Date: ${dateFormatted}`
  const dateW = (doc.getStringUnitWidth(dateText) * 8.5) / doc.internal.scaleFactor
  doc.text(dateText, pageWidth - margin - dateW, y + 15)

  y += 22

  // Decorative horizontal divider
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.6)
  doc.line(margin, y, pageWidth - margin, y)

  y += 5

  // ─── 2. Supplier Info & Payment Summary Card ────────────────────
  const cardHeight = 36
  const colWidth = (contentWidth - 6) / 2

  // Left Box: Supplier Details
  doc.setFillColor(...lightBg)
  doc.roundedRect(margin, y, colWidth, cardHeight, 2, 2, "F")
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, colWidth, cardHeight, 2, 2, "S")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...primaryColor)
  doc.text("VENDOR / SUPPLIER DETAILS", margin + 4, y + 6)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(purchase.supplier_name || "Unknown Supplier", margin + 4, y + 13)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...secondaryColor)

  let supY = y + 18
  if (purchase.supplier_phone) {
    doc.text(`Phone: ${purchase.supplier_phone}`, margin + 4, supY)
    supY += 4.5
  }
  if (purchase.supplier_email) {
    doc.text(`Email: ${purchase.supplier_email}`, margin + 4, supY)
    supY += 4.5
  }
  if (purchase.supplier_address) {
    doc.text(`Address: ${purchase.supplier_address}`, margin + 4, supY)
  } else if (!purchase.supplier_phone && !purchase.supplier_email) {
    doc.text("Supplier record registered in VendaFlow", margin + 4, supY)
  }

  // Right Box: Payment & Terms Summary
  const rightX = margin + colWidth + 6
  doc.setFillColor(...lightBg)
  doc.roundedRect(rightX, y, colWidth, cardHeight, 2, 2, "F")
  doc.setDrawColor(...borderColor)
  doc.roundedRect(rightX, y, colWidth, cardHeight, 2, 2, "S")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...primaryColor)
  doc.text("PAYMENT & TERMS INFORMATION", rightX + 4, y + 6)

  // Status Badge
  const badgeW = 34
  const badgeH = 6
  doc.setFillColor(...statusBg)
  doc.roundedRect(rightX + colWidth - badgeW - 4, y + 3, badgeW, badgeH, 1.5, 1.5, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(...statusText)
  const statusLabelW = (doc.getStringUnitWidth(statusLabel) * 7.5) / doc.internal.scaleFactor
  doc.text(statusLabel, rightX + colWidth - 4 - badgeW + (badgeW - statusLabelW) / 2, y + 7.2)

  // Payment Details List
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...secondaryColor)

  const paymentMethod = purchase.payment_method || "Cash"
  doc.text("Payment Method:", rightX + 4, y + 14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...primaryColor)
  doc.text(paymentMethod, rightX + 32, y + 14)

  const totalAmt = Number(purchase.total_amount) || 0
  const amtPaid =
    purchase.amount_paid !== null && purchase.amount_paid !== undefined
      ? Number(purchase.amount_paid)
      : statusLabel === "FULLY PAID"
        ? totalAmt
        : 0
  const amtDue =
    purchase.amount_due !== null && purchase.amount_due !== undefined
      ? Number(purchase.amount_due)
      : Math.max(0, totalAmt - amtPaid)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...secondaryColor)
  doc.text("Amount Paid:", rightX + 4, y + 19.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(21, 128, 61) // Emerald green
  doc.text(formatCurrency(amtPaid), rightX + 32, y + 19.5)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...secondaryColor)
  doc.text("Balance Due:", rightX + 4, y + 25)
  doc.setFont("helvetica", "bold")
  if (amtDue > 0) {
    doc.setTextColor(185, 28, 28) // Red
  } else {
    doc.setTextColor(...primaryColor)
  }
  doc.text(formatCurrency(amtDue), rightX + 32, y + 25)

  if (purchase.agreement_terms) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...secondaryColor)
    doc.text(`Terms: ${purchase.agreement_terms}`, rightX + 4, y + 30.5)
  } else {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.setTextColor(...secondaryColor)
    doc.text(`Status recorded: ${statusLabel}`, rightX + 4, y + 30.5)
  }

  y += cardHeight + 8

  // ─── 3. Purchase Order Items Table ─────────────────────────────
  // Table Header
  const col1W = 12 // #
  const col2W = 80 // Description & SKU
  const col3W = 20 // Qty
  const col4W = 34 // Unit Cost
  const col5W = 36 // Total Cost

  doc.setFillColor(...primaryColor)
  doc.rect(margin, y, contentWidth, 8, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)

  doc.text("#", margin + 3, y + 5.5)
  doc.text("ITEM DESCRIPTION & SKU", margin + col1W + 2, y + 5.5)
  doc.text("QTY", margin + col1W + col2W + 2, y + 5.5)
  doc.text("UNIT COST", margin + col1W + col2W + col3W + 2, y + 5.5)
  doc.text("TOTAL AMOUNT", margin + col1W + col2W + col3W + col4W + 2, y + 5.5)

  y += 8

  // Table Body Rows
  let itemIndex = 1
  for (const item of items) {
    // Check if new page is needed
    if (y > pageHeight - 65) {
      doc.addPage()
      y = margin + 10

      // Re-draw header on new page
      doc.setFillColor(...primaryColor)
      doc.rect(margin, y, contentWidth, 8, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text("#", margin + 3, y + 5.5)
      doc.text("ITEM DESCRIPTION & SKU", margin + col1W + 2, y + 5.5)
      doc.text("QTY", margin + col1W + col2W + 2, y + 5.5)
      doc.text("UNIT COST", margin + col1W + col2W + col3W + 2, y + 5.5)
      doc.text("TOTAL AMOUNT", margin + col1W + col2W + col3W + col4W + 2, y + 5.5)
      y += 8
    }

    const rowH = item.product_sku ? 11 : 8.5
    // Alternate row zebra styling
    if (itemIndex % 2 === 0) {
      doc.setFillColor(250, 250, 252)
      doc.rect(margin, y, contentWidth, rowH, "F")
    }

    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.2)
    doc.line(margin, y + rowH, margin + contentWidth, y + rowH)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(...primaryColor)

    // Index
    doc.text(String(itemIndex), margin + 3, y + 5.5)

    // Product Name & SKU
    doc.setFont("helvetica", "bold")
    const pName = item.product_name || "Item"
    doc.text(pName.length > 40 ? pName.substring(0, 38) + "..." : pName, margin + col1W + 2, y + 5.2)

    if (item.product_sku) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(...secondaryColor)
      doc.text(`SKU: ${item.product_sku}`, margin + col1W + 2, y + 9)
    }

    // Quantity
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(...primaryColor)
    doc.text(String(item.quantity), margin + col1W + col2W + 4, y + 5.5)

    // Unit Cost
    doc.text(formatCurrency(item.unit_cost), margin + col1W + col2W + col3W + 2, y + 5.5)

    // Total Cost
    doc.setFont("helvetica", "bold")
    doc.text(formatCurrency(item.total_cost), margin + col1W + col2W + col3W + col4W + 2, y + 5.5)

    y += rowH
    itemIndex++
  }

  y += 4

  // ─── 4. Totals Breakdown & Notes Box ────────────────────────────
  if (y > pageHeight - 60) {
    doc.addPage()
    y = margin + 10
  }

  const totalsBoxW = 75
  const totalsBoxX = pageWidth - margin - totalsBoxW
  const notesBoxW = contentWidth - totalsBoxW - 6

  // Left: Notes / Terms Details Box
  doc.setFillColor(...lightBg)
  doc.roundedRect(margin, y, notesBoxW, 36, 1.5, 1.5, "F")
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, notesBoxW, 36, 1.5, 1.5, "S")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(...primaryColor)
  doc.text("PURCHASE & AGREEMENT NOTES", margin + 4, y + 5.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...secondaryColor)

  let noteLines: string[] = []
  if (purchase.agreement_terms) {
    noteLines.push(`Agreement Terms: ${purchase.agreement_terms}`)
  }
  if (purchase.notes) {
    noteLines.push(`Notes: ${purchase.notes}`)
  }
  if (noteLines.length === 0) {
    noteLines.push("Goods received in good condition in accordance with agreed procurement order terms.")
    noteLines.push(`Payment Status: ${statusLabel} via ${paymentMethod}.`)
  }

  let noteY = y + 11
  for (const nl of noteLines) {
    const splitNotes = doc.splitTextToSize(nl, notesBoxW - 8)
    for (const line of splitNotes) {
      if (noteY < y + 33) {
        doc.text(line, margin + 4, noteY)
        noteY += 4.2
      }
    }
  }

  // Right: Financial Summary Box
  doc.setFillColor(...lightBg)
  doc.roundedRect(totalsBoxX, y, totalsBoxW, 36, 1.5, 1.5, "F")
  doc.setDrawColor(...borderColor)
  doc.roundedRect(totalsBoxX, y, totalsBoxW, 36, 1.5, 1.5, "S")

  let sumY = y + 6.5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...secondaryColor)
  doc.text("Subtotal:", totalsBoxX + 4, sumY)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...primaryColor)
  const subtotalStr = formatCurrency(totalAmt)
  const subtotalW = (doc.getStringUnitWidth(subtotalStr) * 8.5) / doc.internal.scaleFactor
  doc.text(subtotalStr, totalsBoxX + totalsBoxW - 4 - subtotalW, sumY)

  sumY += 6.5
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...secondaryColor)
  doc.text("Amount Paid:", totalsBoxX + 4, sumY)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(21, 128, 61)
  const paidStr = formatCurrency(amtPaid)
  const paidW = (doc.getStringUnitWidth(paidStr) * 8.5) / doc.internal.scaleFactor
  doc.text(paidStr, totalsBoxX + totalsBoxW - 4 - paidW, sumY)

  sumY += 6.5
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...secondaryColor)
  doc.text("Balance Due:", totalsBoxX + 4, sumY)
  doc.setFont("helvetica", "bold")
  if (amtDue > 0) {
    doc.setTextColor(185, 28, 28)
  } else {
    doc.setTextColor(...primaryColor)
  }
  const dueStr = formatCurrency(amtDue)
  const dueW = (doc.getStringUnitWidth(dueStr) * 8.5) / doc.internal.scaleFactor
  doc.text(dueStr, totalsBoxX + totalsBoxW - 4 - dueW, sumY)

  // Divider inside summary
  sumY += 3.5
  doc.setDrawColor(...borderColor)
  doc.line(totalsBoxX + 4, sumY, totalsBoxX + totalsBoxW - 4, sumY)

  sumY += 5.5
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...primaryColor)
  doc.text("TOTAL ORDER:", totalsBoxX + 4, sumY)
  const totalStr = formatCurrency(totalAmt)
  const totalW = (doc.getStringUnitWidth(totalStr) * 10) / doc.internal.scaleFactor
  doc.text(totalStr, totalsBoxX + totalsBoxW - 4 - totalW, sumY)

  y += 44

  // ─── 5. Signatures Block ─────────────────────────────────────────
  if (y > pageHeight - 35) {
    doc.addPage()
    y = margin + 10
  }

  const signW = (contentWidth - 10) / 2
  // Buyer signature
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...secondaryColor)
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.4)
  doc.line(margin, y + 12, margin + signW, y + 12)
  doc.text("Authorized Procurement Officer (Signature & Date)", margin, y + 16.5)

  // Supplier signature
  const sign2X = margin + signW + 10
  doc.line(sign2X, y + 12, sign2X + signW, y + 12)
  doc.text("Supplier / Vendor Acceptance (Signature & Date)", sign2X, y + 16.5)

  // ─── 6. Footer ──────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184) // Slate 400
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.2)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

    const footerLeft = `${store.name} • Official Purchase Order • ${refText}`
    doc.text(footerLeft, margin, pageHeight - 6.5)

    const footerRight = `Page ${i} of ${totalPages}`
    const frW = (doc.getStringUnitWidth(footerRight) * 7.5) / doc.internal.scaleFactor
    doc.text(footerRight, pageWidth - margin - frW, pageHeight - 6.5)
  }

  return doc.output("blob")
}

/**
 * Triggers a browser file download of the generated Purchase Order PDF.
 */
export async function downloadPurchaseOrderPDF(options: PurchaseOrderPDFOptions): Promise<void> {
  const blob = await generatePurchaseOrderPDF(options)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const cleanRef = (options.purchase.reference_number || "order").replace(/[^a-zA-Z0-9-_]/g, "_")
  a.download = `Purchase_Order_${cleanRef}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
