"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { RefreshCw, ArrowUpRight, ArrowDownRight, Minus, Calculator } from "lucide-react"

type PeriodData = {
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

type AccountingResponse = {
  today: PeriodData
  week: PeriodData
  month: PeriodData
  currency: string
  updatedAt: string
}

export function DashboardAccounting() {
  const [data, setData] = useState<AccountingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounting = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/dashboard/accounting?_t=${Date.now()}`, {
        cache: "no-store",
      })

      if (!res.ok) {
        throw new Error(`Failed to load accounting data (${res.status})`)
      }

      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error("Failed to fetch accounting metrics:", err)
      setError(err.message || "Failed to load accounting metrics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounting()
  }, [])

  const renderStatusBadge = (period?: PeriodData) => {
    if (!period) return null
    if (period.netProfit > 0) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">
          <ArrowUpRight className="h-3 w-3 mr-1 inline" />
          Profit
        </Badge>
      )
    }
    if (period.netProfit < 0) {
      return (
        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200">
          <ArrowDownRight className="h-3 w-3 mr-1 inline" />
          Loss
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Minus className="h-3 w-3 mr-1 inline" />
        Break-even
      </Badge>
    )
  }

  const formatProfitValue = (value: number, currency = "KES") => {
    if (value > 0) return `+ ${formatCurrency(value, currency)}`
    if (value < 0) return `- ${formatCurrency(Math.abs(value), currency)}`
    return formatCurrency(0, currency)
  }

  const getProfitColorClass = (value: number) => {
    if (value > 0) return "text-emerald-600 dark:text-emerald-400"
    if (value < 0) return "text-rose-600 dark:text-rose-400"
    return "text-muted-foreground"
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Profit & Loss Accounting</CardTitle>
          </div>
          <CardDescription>
            Simple business financial summary showing revenue, costs, expenses, and net profit
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAccounting}
          disabled={loading}
          className="self-start sm:self-auto h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? (
          <div className="p-4 text-center text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        ) : null}

        {/* 3 Quick Cards: Today / This Week / This Month */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Today */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Today
              </span>
              {renderStatusBadge(data?.today)}
            </div>
            {loading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <div className={`text-2xl font-bold font-mono ${getProfitColorClass(data?.today.netProfit || 0)}`}>
                {formatProfitValue(data?.today.netProfit || 0)}
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(data?.today.salesRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expenses:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(data?.today.expenses || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Net Margin:</span>
                <span className="font-mono">{(data?.today.netMargin || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                This Week
              </span>
              {renderStatusBadge(data?.week)}
            </div>
            {loading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <div className={`text-2xl font-bold font-mono ${getProfitColorClass(data?.week.netProfit || 0)}`}>
                {formatProfitValue(data?.week.netProfit || 0)}
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(data?.week.salesRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expenses:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(data?.week.expenses || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Net Margin:</span>
                <span className="font-mono">{(data?.week.netMargin || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                This Month
              </span>
              {renderStatusBadge(data?.month)}
            </div>
            {loading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <div className={`text-2xl font-bold font-mono ${getProfitColorClass(data?.month.netProfit || 0)}`}>
                {formatProfitValue(data?.month.netProfit || 0)}
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(data?.month.salesRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expenses:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(data?.month.expenses || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Net Margin:</span>
                <span className="font-mono">{(data?.month.netMargin || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accounting Statement Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-foreground">Statement Item</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Today</TableHead>
                <TableHead className="text-right font-semibold text-foreground">This Week</TableHead>
                <TableHead className="text-right font-semibold text-foreground">This Month</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Sales Revenue */}
              <TableRow>
                <TableCell className="font-medium">
                  Sales Revenue <span className="text-xs text-muted-foreground">(+)</span>
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatCurrency(data?.today.salesRevenue || 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatCurrency(data?.week.salesRevenue || 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatCurrency(data?.month.salesRevenue || 0)}
                </TableCell>
              </TableRow>

              {/* COGS */}
              <TableRow>
                <TableCell className="text-muted-foreground">
                  Cost of Goods Sold (COGS) <span className="text-xs">(-)</span>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCurrency(data?.today.cogs || 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCurrency(data?.week.cogs || 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCurrency(data?.month.cogs || 0)}
                </TableCell>
              </TableRow>

              {/* Gross Profit */}
              <TableRow className="bg-muted/20 font-medium">
                <TableCell>
                  Gross Profit <span className="text-xs text-muted-foreground">(= Revenue - COGS)</span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.today.grossProfit || 0)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.week.grossProfit || 0)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.month.grossProfit || 0)}
                </TableCell>
              </TableRow>

              {/* Operating Expenses */}
              <TableRow>
                <TableCell className="text-muted-foreground">
                  Operating Expenses <span className="text-xs">(-)</span>
                </TableCell>
                <TableCell className="text-right font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(data?.today.expenses || 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(data?.week.expenses || 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(data?.month.expenses || 0)}
                </TableCell>
              </TableRow>

              {/* Net Profit / Loss Highlight Row */}
              <TableRow className="border-t-2 border-b-2 font-bold bg-muted/40">
                <TableCell className="text-base">
                  Net Profit / (Loss)
                </TableCell>
                <TableCell className={`text-right font-mono text-base ${getProfitColorClass(data?.today.netProfit || 0)}`}>
                  {formatProfitValue(data?.today.netProfit || 0)}
                </TableCell>
                <TableCell className={`text-right font-mono text-base ${getProfitColorClass(data?.week.netProfit || 0)}`}>
                  {formatProfitValue(data?.week.netProfit || 0)}
                </TableCell>
                <TableCell className={`text-right font-mono text-base ${getProfitColorClass(data?.month.netProfit || 0)}`}>
                  {formatProfitValue(data?.month.netProfit || 0)}
                </TableCell>
              </TableRow>

              {/* Stock Purchases */}
              <TableRow className="text-xs text-muted-foreground">
                <TableCell>
                  Stock Purchases <span className="text-[11px]">(Restocking outflows)</span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.today.purchases || 0)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.week.purchases || 0)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.month.purchases || 0)}
                </TableCell>
              </TableRow>

              {/* Net Cash Flow */}
              <TableRow className="text-xs text-muted-foreground">
                <TableCell>
                  Net Cash Flow <span className="text-[11px]">(Revenue - Expenses - Purchases)</span>
                </TableCell>
                <TableCell className={`text-right font-mono font-medium ${getProfitColorClass(data?.today.netCashFlow || 0)}`}>
                  {formatProfitValue(data?.today.netCashFlow || 0)}
                </TableCell>
                <TableCell className={`text-right font-mono font-medium ${getProfitColorClass(data?.week.netCashFlow || 0)}`}>
                  {formatProfitValue(data?.week.netCashFlow || 0)}
                </TableCell>
                <TableCell className={`text-right font-mono font-medium ${getProfitColorClass(data?.month.netCashFlow || 0)}`}>
                  {formatProfitValue(data?.month.netCashFlow || 0)}
                </TableCell>
              </TableRow>

              {/* Net Margin */}
              <TableRow className="text-xs text-muted-foreground bg-muted/10">
                <TableCell>Net Profit Margin</TableCell>
                <TableCell className="text-right font-mono">
                  {(data?.today.netMargin || 0).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right font-mono">
                  {(data?.week.netMargin || 0).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right font-mono">
                  {(data?.month.netMargin || 0).toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
