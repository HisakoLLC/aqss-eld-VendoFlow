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
const PAGE_W = 80        // 80mm thermal width
const MARGIN  = 5        // left/right margin
const COL_W   = PAGE_W - MARGIN * 2  // usable content width
const FONT    = "courier" // monospaced = perfect column alignment

// Character widths at 8pt courier on 80mm page
// At 8pt, ~1 char ≈ 1.48mm → ~47 chars fit across COL_W (70mm)
const CHARS = 47

// ─── Helpers ─────────────────────────────────────────────────

function dashedLine(count = CHARS): string {
  return "-".repeat(count)
}

function equalLine(count = CHARS): string {
  return "=".repeat(count)
}

/** Left-pad text to fill a field of [width] characters */
function padLeft(text: string, width: number): string {
  return text.padStart(width)
}

/** Right-pad text to fill a field of [width] characters */
function padRight(text: string, width: number): string {
  return text.padEnd(width)
}

/** Truncate a string to [max] chars */
function trunc(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + "…"
}

/**
 * Build a two-column line: left text + right text that together fill CHARS.
 * If they're too long, left gets truncated.
 */
function twoCol(left: string, right: string, total = CHARS): string {
  const rightLen = right.length
  const leftMax = total - rightLen - 1
  const leftStr = trunc(left, leftMax).padEnd(leftMax)
  return `${leftStr} ${right}`
}

/**
 * Build a three-column item line:
 *   Name (leftmost) | Qty (middle) | Price (rightmost)
 */
function itemLine(name: string, qty: string, price: string, total = CHARS): string {
  const rightPart = `${qty.padStart(4)} ${price.padStart(10)}`
  const leftMax = total - rightPart.length - 1
  const leftStr = trunc(name, leftMax).padEnd(leftMax)
  return `${leftStr} ${rightPart}`
}

export async function generateReceipt(data: ReceiptData): Promise<Blob> {
  try {
    // ─── Estimate page height ─────────────────────────────────
    // We'll calculate lines needed and set height accordingly
    const headerLines = 8
    const itemLines   = data.items.length * 3   // name + subtotal + blank
    const footerLines = 14
    const totalLines  = headerLines + itemLines + footerLines
    const lineHeight  = 3.8  // mm per line at 8pt
    const pageHeight  = Math.max(160, totalLines * lineHeight + 30)

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [PAGE_W, pageHeight],
    })

    let y = 8

    // ─── Font setup (monospaced for perfect alignment) ────────
    doc.setFont(FONT, "normal")
    doc.setFontSize(8)
    const LH = 3.8   // line height in mm

    // ─── Helper: print a line ─────────────────────────────────
    const print = (text: string, opts: {
      bold?: boolean
      size?: number
      color?: [number, number, number]
      align?: "left" | "center" | "right"
    } = {}) => {
      const { bold = false, size = 8, color = [0,0,0], align = "left" } = opts
      doc.setFont(FONT, bold ? "bold" : "normal")
      doc.setFontSize(size)
      doc.setTextColor(...color)

      const lh = size <= 8 ? LH : size <= 10 ? 4.5 : 5.5

      if (align === "center") {
        const tw = (doc.getStringUnitWidth(text) * size) / doc.internal.scaleFactor
        const x  = (PAGE_W - tw) / 2
        doc.text(text, x, y)
      } else if (align === "right") {
        const tw = (doc.getStringUnitWidth(text) * size) / doc.internal.scaleFactor
        const x  = PAGE_W - MARGIN - tw
        doc.text(text, x, y)
      } else {
        doc.text(text, MARGIN, y)
      }
      y += lh
    }

    const nl = (lines = 1) => { y += LH * lines }

    // Reset color helper
    const black = () => doc.setTextColor(0, 0, 0)

    // ─── HEADER ──────────────────────────────────────────────
    print(data.storeInfo.name.toUpperCase(), { bold: true, size: 12, align: "center" })
    nl(0.3)
    print(data.storeInfo.address, { size: 7, color: [80,80,80], align: "center" })
    print(data.storeInfo.phone,   { size: 7, color: [80,80,80], align: "center" })
    print(data.storeInfo.email,   { size: 7, color: [80,80,80], align: "center" })
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

    print(twoCol("Receipt No:", data.receiptNumber))
    print(twoCol("Date:",       dateStr))
    print(twoCol("Time:",       timeStr))

    if (data.customerName) {
      print(twoCol("Customer:", trunc(data.customerName, 28)))
    }

    print(twoCol("Payment:", data.paymentMethod))

    if (data.paymentReference) {
      print(twoCol("Reference:", trunc(data.paymentReference, 27)))
    }

    if (data.paymentStatus) {
      const statusColors: Record<string, [number,number,number]> = {
        Paid:    [30, 140, 60],
        Unpaid:  [200, 40, 40],
        Partial: [180, 100, 0],
      }
      const col = statusColors[data.paymentStatus] ?? [0,0,0]
      const statusLine = twoCol("Status:", data.paymentStatus.toUpperCase())
      doc.setFont(FONT, "bold")
      doc.setFontSize(8)
      doc.setTextColor(...col)
      doc.text(statusLine, MARGIN, y)
      y += LH
      black()
    }

    nl(0.3)
    print(dashedLine())

    // ─── ITEMS HEADER ────────────────────────────────────────
    print(itemLine("ITEM", "QTY", "AMOUNT"), { bold: true })
    print(dashedLine())

    // ─── ITEMS ───────────────────────────────────────────────
    doc.setFont(FONT, "normal")
    doc.setFontSize(8)

    for (const item of data.items) {
      // Row 1: name | qty | unit price
      print(itemLine(item.name, `${item.quantity}x`, formatCurrency(item.price)))

      // Row 2: SKU on left, line total on right (indented)
      const skuLabel = `  SKU:${item.sku.slice(0,14)}`
      const lineTotal = formatCurrency(item.total)
      print(twoCol(skuLabel, lineTotal), { color: [100,100,100] })

      black()
      nl(0.2)
    }

    print(dashedLine())
    nl(0.2)

    // ─── TOTALS ───────────────────────────────────────────────
    if (data.paymentStatus === "Partial" && data.amountPaid !== undefined && data.amountDue !== undefined) {
      print(twoCol("SUBTOTAL:", formatCurrency(data.total)))
      print(twoCol("AMOUNT PAID:", formatCurrency(data.amountPaid)))
      nl(0.2)
      // Amount due in red
      doc.setFont(FONT, "bold")
      doc.setFontSize(8)
      doc.setTextColor(200, 40, 40)
      doc.text(twoCol("BALANCE DUE:", formatCurrency(data.amountDue)), MARGIN, y)
      y += LH
      black()
    }

    nl(0.2)
    print(equalLine())

    // Grand total — largest text on the receipt
    doc.setFont(FONT, "bold")
    doc.setFontSize(11)
    doc.setTextColor(0,0,0)
    const totalLabel = "TOTAL:"
    const totalAmt   = formatCurrency(data.total)
    const totalLine  = twoCol(totalLabel, totalAmt)
    doc.text(totalLine, MARGIN, y)
    y += 5.5

    print(equalLine())
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
      const creditLine = "*** CREDIT SALE — PAYMENT PENDING ***"
      const tw = (doc.getStringUnitWidth(creditLine) * 8) / doc.internal.scaleFactor
      doc.text(creditLine, (PAGE_W - tw) / 2, y)
      y += LH
      black()
      nl(0.3)
    }

    // ─── BARCODE ──────────────────────────────────────────────
    try {
      const barcodeDataURL = await generateBarcodeDataURL(data.receiptNumber)
      const bw = 64
      const bh = 14
      const bx = (PAGE_W - bw) / 2
      doc.addImage(barcodeDataURL, "PNG", bx, y, bw, bh)
      y += bh + 1
      doc.setFont(FONT, "normal")
      doc.setFontSize(7)
      doc.setTextColor(80,80,80)
      const rn = data.receiptNumber
      const rnW = (doc.getStringUnitWidth(rn) * 7) / doc.internal.scaleFactor
      doc.text(rn, (PAGE_W - rnW) / 2, y)
      y += LH
      black()
    } catch {
      doc.setFont(FONT, "normal")
      doc.setFontSize(8)
      print(twoCol("Receipt:", data.receiptNumber), { align: "center" })
    }

    nl(0.5)
    print(dashedLine())
    nl(0.3)

    // ─── FOOTER ───────────────────────────────────────────────
    print("Thank you for your business!", { align: "center", bold: true, size: 8 })
    nl(0.2)
    print("Please keep this receipt for your records.", { align: "center", size: 7, color: [100,100,100] })
    nl(0.5)
    print("Powered by AQSS VendoFlow", { align: "center", size: 7, color: [140,140,140] })

    return doc.output("blob")
  } catch (error: any) {
    console.error("Receipt generation failed:", error)
    throw new Error(`Receipt generation failed: ${error.message}`)
  }
}
