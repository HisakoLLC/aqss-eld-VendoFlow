/**
 * Utility functions for purchase payment calculations and reconciliation.
 */

export function reconcilePurchasePayment(purchase: {
  total_amount?: number | string | null
  payment_status?: string | null
  amount_paid?: number | string | null
  amount_due?: number | string | null
}): { amountPaid: number; amountDue: number } {
  const totalAmount = Number(purchase.total_amount) || 0
  const statusStr = (purchase.payment_status || "Paid").trim()
  const statusLower = statusStr.toLowerCase()

  const hasRawPaid = purchase.amount_paid !== null && purchase.amount_paid !== undefined
  const hasRawDue = purchase.amount_due !== null && purchase.amount_due !== undefined
  const rawPaid = hasRawPaid ? Number(purchase.amount_paid) : null
  const rawDue = hasRawDue ? Number(purchase.amount_due) : null

  let amountPaid = 0
  let amountDue = 0

  if (statusLower === "paid" || statusLower === "fully paid") {
    amountPaid = totalAmount
    amountDue = 0
  } else if (statusLower === "unpaid") {
    amountPaid = 0
    amountDue = totalAmount
  } else if (statusLower.includes("credit") || statusLower.includes("agree")) {
    // If it's on credit/agreement:
    // If rawPaid was erroneously set to totalAmount or rawDue was 0 (from old schema default),
    // then the purchase hasn't been paid yet.
    if (rawPaid !== null && rawPaid > 0 && rawPaid < totalAmount) {
      amountPaid = rawPaid
      amountDue = Math.max(0, totalAmount - amountPaid)
    } else if (rawDue !== null && rawDue > 0 && rawDue <= totalAmount && (rawPaid === null || rawPaid === 0)) {
      amountDue = rawDue
      amountPaid = Math.max(0, totalAmount - amountDue)
    } else {
      amountPaid = 0
      amountDue = totalAmount
    }
  } else if (statusLower.includes("part")) {
    if (rawPaid !== null && rawPaid > 0 && rawPaid < totalAmount) {
      amountPaid = rawPaid
      amountDue = Math.max(0, totalAmount - amountPaid)
    } else if (rawDue !== null && rawDue > 0 && rawDue < totalAmount) {
      amountDue = rawDue
      amountPaid = Math.max(0, totalAmount - amountDue)
    } else {
      amountPaid = totalAmount / 2
      amountDue = totalAmount - amountPaid
    }
  } else {
    if (rawPaid !== null && rawPaid >= 0) {
      amountPaid = rawPaid
      amountDue = rawDue !== null ? rawDue : Math.max(0, totalAmount - amountPaid)
    } else {
      amountPaid = totalAmount
      amountDue = 0
    }
  }

  return { amountPaid, amountDue }
}
