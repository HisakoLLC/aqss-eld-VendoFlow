import { jsPDF } from "jspdf"
import { formatCurrency } from "@/lib/utils"
import { generateBarcodeDataURL } from "./barcode-generator"

type ReceiptItem = {
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

type StoreInfo = {
  name: string
  address: string
  phone: string
  email: string
}

type ReceiptData = {
  receiptNumber: string
  date: Date
  items: ReceiptItem[]
  total: number
  paymentMethod: string
  paymentReference?: string
  customerName?: string
  storeInfo: StoreInfo
  paymentStatus?: string
  amountPaid?: number
  amountDue?: number
}

// ─── Constants ────────────────────────────────────────────────
const PAGE_W = 80        // 80mm standard thermal receipt width
const MARGIN  = 5        // 5mm margin on both left and right
const COL_W   = PAGE_W - MARGIN * 2  // 70mm usable content width
const FONT    = "courier" // monospaced thermal receipt font

// At 8pt Courier, each char ≈ 1.693mm. Across 70mm, 41 chars fit safely (41 * 1.693 = 69.4mm).
const CHARS = 41

// ─── Helpers ─────────────────────────────────────────────────
function dashedLine(count = CHARS): string {
  return "-".repeat(count)
}

function equalLine(count = CHARS): string {
  return "=".repeat(count)
}

export async function generateReceipt(data: ReceiptData): Promise<Blob> {
  try {
    // ─── Dynamic page height calculation ──────────────────────
    const baseHeight = 145 // Header, meta, totals, barcode, footer, and margins
    const itemHeight = data.items.length * 9.5
    const extraLinesHeight =
      (data.customerName ? 4 : 0) +
      (data.paymentReference ? 4 : 0) +
      (data.paymentStatus === "Partial" ? 22 : 0) +
      (data.paymentStatus === "Unpaid" ? 8 : 0)

    const pageHeight = Math.max(150, Math.ceil(baseHeight + itemHeight + extraLinesHeight))

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [PAGE_W, pageHeight],
    })

    let y = 8
    const LH = 3.8 // line height in mm

    // Helper: calculate text width in mm
    const textWidth = (text: string, size = 8): number => {
      return (doc.getStringUnitWidth(text) * size) / doc.internal.scaleFactor
    }

    // Helper: reset text color
    const black = () => doc.setTextColor(0, 0, 0)

    // Advance y
    const nl = (lines = 1) => { y += LH * lines }

    // Print a single line (center, left, or right)
    const print = (text: string, opts: {
      bold?: boolean
      size?: number
      color?: [number, number, number]
      align?: "left" | "center" | "right"
    } = {}) => {
      const { bold = false, size = 8, color = [0, 0, 0], align = "left" } = opts
      doc.setFont(FONT, bold ? "bold" : "normal")
      doc.setFontSize(size)
      doc.setTextColor(...color)

      const lh = size <= 8 ? LH : size <= 10 ? 4.5 : 5.5

      if (align === "center") {
        const tw = textWidth(text, size)
        const x = (PAGE_W - tw) / 2
        doc.text(text, x, y)
      } else if (align === "right") {
        const tw = textWidth(text, size)
        const x = PAGE_W - MARGIN - tw
        doc.text(text, x, y)
      } else {
        doc.text(text, MARGIN, y)
      }
      y += lh
    }

    // Helper: print two-column row with coordinate positioning (prevents overflow)
    const printRow = (
      left: string,
      right: string,
      opts: {
        bold?: boolean
        size?: number
        color?: [number, number, number]
      } = {}
    ) => {
      const { bold = false, size = 8, color = [0, 0, 0] } = opts
      doc.setFont(FONT, bold ? "bold" : "normal")
      doc.setFontSize(size)
      doc.setTextColor(...color)

      const lh = size <= 8 ? LH : size <= 10 ? 4.5 : 5.5

      // Right text ends exactly at PAGE_W - MARGIN (75mm)
      const rightW = textWidth(right, size)
      const rightX = PAGE_W - MARGIN - rightW

      // Left text safe width to avoid colliding with right column
      const maxLeftW = Math.max(10, rightX - MARGIN - 2)
      let safeLeft = left
      let leftW = textWidth(safeLeft, size)
      while (leftW > maxLeftW && safeLeft.length > 4) {
        safeLeft = safeLeft.slice(0, -2) + "…"
        leftW = textWidth(safeLeft, size)
      }

      doc.text(safeLeft, MARGIN, y)
      doc.text(right, rightX, y)
      y += lh
    }

    // Helper: print item row with structured 3 columns
    const printItem = (item: ReceiptItem) => {
      doc.setFont(FONT, "normal")
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)

      const qtyStr = `${item.quantity}x`
      const priceStr = formatCurrency(item.price)
      const skuStr = item.sku ? `  SKU:${item.sku.slice(0, 14)}` : ""
      const totalStr = formatCurrency(item.total)

      // Column coordinate anchors
      const qtyColRight = PAGE_W - MARGIN - 24 // 51mm
      const priceColRight = PAGE_W - MARGIN   // 75mm

      const qtyW = textWidth(qtyStr, 8)
      const priceW = textWidth(priceStr, 8)

      // Safe name truncation
      const maxNameW = Math.max(15, qtyColRight - qtyW - MARGIN - 2)
      let safeName = item.name
      let nameW = textWidth(safeName, 8)
      while (nameW > maxNameW && safeName.length > 4) {
        safeName = safeName.slice(0, -2) + "…"
        nameW = textWidth(safeName, 8)
      }

      // Line 1: Name | Qty | Unit Price
      doc.text(safeName, MARGIN, y)
      doc.text(qtyStr, qtyColRight - qtyW, y)
      doc.text(priceStr, priceColRight - priceW, y)
      y += LH

      // Line 2: SKU | Line Total (in subtle grey)
      doc.setTextColor(100, 100, 100)
      if (skuStr) {
        doc.text(skuStr, MARGIN, y)
      }
      const totalW = textWidth(totalStr, 8)
      doc.text(totalStr, priceColRight - totalW, y)
      y += LH
      black()
      nl(0.2)
    }

    // Helper: print items table header
    const printItemsHeader = () => {
      doc.setFont(FONT, "bold")
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)

      const qtyColRight = PAGE_W - MARGIN - 24 // 51mm
      const priceColRight = PAGE_W - MARGIN   // 75mm

      const qtyW = textWidth("QTY", 8)
      const priceW = textWidth("AMOUNT", 8)

      doc.text("ITEM", MARGIN, y)
      doc.text("QTY", qtyColRight - qtyW, y)
      doc.text("AMOUNT", priceColRight - priceW, y)
      y += LH
    }

    // ─── HEADER ──────────────────────────────────────────────
    print(data.storeInfo.name.toUpperCase(), { bold: true, size: 12, align: "center" })
    nl(0.3)
    print(data.storeInfo.address, { size: 7, color: [80, 80, 80], align: "center" })
    print(data.storeInfo.phone,   { size: 7, color: [80, 80, 80], align: "center" })
    print(data.storeInfo.email,   { size: 7, color: [80, 80, 80], align: "center" })
    nl(0.5)
    print(equalLine(), { size: 8, align: "center" })
    print("OFFICIAL RECEIPT", { bold: true, size: 9, align: "center" })
    print(equalLine(), { size: 8, align: "center" })
    nl(0.3)

    // ─── RECEIPT META ─────────────────────────────────────────
    const dateStr = data.date.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    })
    const timeStr = data.date.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    })

    printRow("Receipt No:", data.receiptNumber)
    printRow("Date:",       dateStr)
    printRow("Time:",       timeStr)

    if (data.customerName) {
      printRow("Customer:", data.customerName)
    }

    printRow("Payment:", data.paymentMethod)

    if (data.paymentReference) {
      printRow("Reference:", data.paymentReference)
    }

    if (data.paymentStatus) {
      const statusColors: Record<string, [number, number, number]> = {
        Paid:    [30, 140, 60],
        Unpaid:  [200, 40, 40],
        Partial: [180, 100, 0],
      }
      const col = statusColors[data.paymentStatus] ?? [0, 0, 0]
      printRow("Status:", data.paymentStatus.toUpperCase(), {
        bold: true,
        color: col,
      })
      black()
    }

    nl(0.3)
    print(dashedLine(), { align: "center" })

    // ─── ITEMS HEADER ────────────────────────────────────────
    printItemsHeader()
    print(dashedLine(), { align: "center" })

    // ─── ITEMS ───────────────────────────────────────────────
    for (const item of data.items) {
      printItem(item)
    }

    print(dashedLine(), { align: "center" })
    nl(0.2)

    // ─── TOTALS ───────────────────────────────────────────────
    if (data.paymentStatus === "Partial" && data.amountPaid !== undefined && data.amountDue !== undefined) {
      printRow("SUBTOTAL:", formatCurrency(data.total))
      printRow("AMOUNT PAID:", formatCurrency(data.amountPaid))
      nl(0.2)
      printRow("BALANCE DUE:", formatCurrency(data.amountDue), {
        bold: true,
        size: 8,
        color: [200, 40, 40],
      })
      black()
    }

    nl(0.2)
    print(equalLine(), { align: "center" })

    // Grand total — prominent on the receipt, perfectly aligned to right margin
    printRow("TOTAL:", formatCurrency(data.total), { bold: true, size: 11 })

    print(equalLine(), { align: "center" })
    nl(0.5)

    // ─── NOTES / WARNINGS ─────────────────────────────────────
    if (data.paymentStatus === "Partial" && data.amountDue && data.amountDue > 0) {
      doc.setFont(FONT, "normal")
      doc.setFontSize(7)
      doc.setTextColor(180, 100, 0)
      doc.text(`  * Balance of ${formatCurrency(data.amountDue)} is outstanding.`, MARGIN, y)
      y += LH
      doc.text("    Please settle at your earliest convenience.", MARGIN, y)
      y += LH
      black()
      nl(0.3)
    }

    if (data.paymentStatus === "Unpaid") {
      doc.setFont(FONT, "bold")
      doc.setFontSize(8)
      doc.setTextColor(200, 40, 40)
      const creditLine = "*** CREDIT SALE - PAYMENT PENDING ***"
      const tw = textWidth(creditLine, 8)
      doc.text(creditLine, (PAGE_W - tw) / 2, y)
      y += LH
      black()
      nl(0.3)
    }

    // ─── BARCODE ──────────────────────────────────────────────
    try {
      const barcodeDataURL = await generateBarcodeDataURL(data.receiptNumber)
      const bw = 58
      const bh = 13
      const bx = (PAGE_W - bw) / 2
      doc.addImage(barcodeDataURL, "PNG", bx, y, bw, bh)
      y += bh + 1
      doc.setFont(FONT, "normal")
      doc.setFontSize(7)
      doc.setTextColor(80, 80, 80)
      const rn = data.receiptNumber
      const rnW = textWidth(rn, 7)
      doc.text(rn, (PAGE_W - rnW) / 2, y)
      y += LH
      black()
    } catch {
      printRow("Receipt:", data.receiptNumber)
    }

    nl(0.5)
    print(dashedLine(), { align: "center" })
    nl(0.3)

    // ─── FOOTER ───────────────────────────────────────────────
    print("Thank you for your business!", { align: "center", bold: true, size: 8 })
    nl(0.2)
    print("Please keep this receipt for your records.", { align: "center", size: 7, color: [100, 100, 100] })
    nl(0.5)
    print("Powered by AQSS VendoFlow", { align: "center", size: 7, color: [140, 140, 140] })

    return doc.output("blob")
  } catch (error: any) {
    console.error("Receipt generation failed:", error)
    throw new Error(`Receipt generation failed: ${error.message}`)
  }
}
