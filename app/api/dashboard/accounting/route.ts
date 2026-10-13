import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

type AccountingPeriodData = {
  salesRevenue: number
  cogs: number
  grossProfit: number
  grossMargin: number
  expenses: number
  purchases: number
  netProfit: number
  netMargin: number
  netCashFlow: number
  status: "profit" | "loss" | "breakeven"
  transactionsCount: number
  expensesCount: number
  purchasesCount: number
}

function calculatePeriod(
  sales: { total_amount: number; sale_date: string; cogs: number }[],
  expenses: { amount: number; expense_date: string }[],
  purchases: { total_amount: number; purchase_date: string }[],
  startDate: Date,
  endDate: Date,
): AccountingPeriodData {
  const periodSales = sales.filter((s) => {
    if (!s.sale_date) return false
    const d = new Date(s.sale_date)
    return d >= startDate && d <= endDate
  })

  const periodExpenses = expenses.filter((e) => {
    if (!e.expense_date) return false
    const d = new Date(e.expense_date)
    return d >= startDate && d <= endDate
  })

  const periodPurchases = purchases.filter((p) => {
    if (!p.purchase_date) return false
    const d = new Date(p.purchase_date)
    return d >= startDate && d <= endDate
  })

  const salesRevenue = periodSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)
  const cogs = periodSales.reduce((sum, s) => sum + (Number(s.cogs) || 0), 0)
  const grossProfit = salesRevenue - cogs
  const grossMargin = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0

  const expensesTotal = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const purchasesTotal = periodPurchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)

  const netProfit = grossProfit - expensesTotal
  const netMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0
  const netCashFlow = salesRevenue - expensesTotal - purchasesTotal

  const status = netProfit > 0 ? "profit" : netProfit < 0 ? "loss" : "breakeven"

  return {
    salesRevenue,
    cogs,
    grossProfit,
    grossMargin,
    expenses: expensesTotal,
    purchases: purchasesTotal,
    netProfit,
    netMargin,
    netCashFlow,
    status,
    transactionsCount: periodSales.length,
    expensesCount: periodExpenses.length,
    purchasesCount: periodPurchases.length,
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database client" }, { status: 500 })
    }

    const now = new Date()

    // 1. Today boundary (local start of day to end of day)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // 2. This Week boundary (Monday of current week)
    const dayOfWeek = now.getDay()
    const diffToMonday = (dayOfWeek + 6) % 7 // 0 on Monday, 6 on Sunday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0)

    // 3. This Month boundary (1st of month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

    // Earliest boundary needed for filtering
    const earliestDate = startOfMonth < startOfWeek ? startOfMonth : startOfWeek
    const earliestIso = earliestDate.toISOString()

    // Query 1: Products lookup map for cost prices
    const { data: productsData } = await supabase.from("products").select("id, cost_price, price")
    const costMap = new Map<string, number>()
    if (productsData) {
      for (const p of productsData) {
        costMap.set(p.id, Number(p.cost_price) || 0)
      }
    }

    // Query 2: Sales
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("id, total_amount, sale_date")
      .gte("sale_date", earliestIso)
      .order("sale_date", { ascending: false })

    if (salesError) {
      console.error("Accounting API: Error fetching sales:", salesError)
      return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 })
    }

    // Query 3: Sale Items for COGS computation
    const saleIds = salesData?.map((s) => s.id) || []
    const saleCogsMap = new Map<string, number>()

    if (saleIds.length > 0) {
      const { data: saleItemsData } = await supabase
        .from("sale_items")
        .select("sale_id, product_id, quantity")
        .in("sale_id", saleIds)

      if (saleItemsData) {
        for (const item of saleItemsData) {
          const cost = costMap.get(item.product_id) || 0
          const itemCogs = (Number(item.quantity) || 0) * cost
          saleCogsMap.set(item.sale_id, (saleCogsMap.get(item.sale_id) || 0) + itemCogs)
        }
      }
    }

    // Enrich sales with COGS
    const enrichedSales = (salesData || []).map((s) => ({
      total_amount: Number(s.total_amount) || 0,
      sale_date: s.sale_date,
      cogs: saleCogsMap.get(s.id) || 0,
    }))

    // Query 4: Expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select("amount, expense_date")
      .gte("expense_date", earliestIso)

    if (expensesError) {
      console.error("Accounting API: Error fetching expenses:", expensesError)
      return NextResponse.json({ error: "Failed to fetch expenses data" }, { status: 500 })
    }

    const enrichedExpenses = (expensesData || []).map((e) => ({
      amount: Number(e.amount) || 0,
      expense_date: e.expense_date,
    }))

    // Query 5: Purchases
    const { data: purchasesData, error: purchasesError } = await supabase
      .from("purchases")
      .select("total_amount, purchase_date")
      .gte("purchase_date", earliestIso)

    if (purchasesError) {
      console.error("Accounting API: Error fetching purchases:", purchasesError)
      return NextResponse.json({ error: "Failed to fetch purchases data" }, { status: 500 })
    }

    const enrichedPurchases = (purchasesData || []).map((p) => ({
      total_amount: Number(p.total_amount) || 0,
      purchase_date: p.purchase_date,
    }))

    // Compute period accounting
    const today = calculatePeriod(enrichedSales, enrichedExpenses, enrichedPurchases, startOfToday, endOfToday)
    const week = calculatePeriod(enrichedSales, enrichedExpenses, enrichedPurchases, startOfWeek, endOfToday)
    const month = calculatePeriod(enrichedSales, enrichedExpenses, enrichedPurchases, startOfMonth, endOfToday)

    return NextResponse.json({
      today,
      week,
      month,
      currency: "KES",
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Accounting API unhandled error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
