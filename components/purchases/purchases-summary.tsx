import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ShoppingBag, DollarSign, Calendar, Users, CheckCircle2, AlertCircle } from "lucide-react"

type PurchasesSummaryProps = {
  totalPurchases: number
  totalAmount: number
  paidAmount: number
  paidCount: number
  unpaidAmount: number
  unpaidCount: number
  thisMonthAmount: number
  thisMonthCount: number
  uniqueSuppliersCount: number
  averageOrder: number
  currency?: string
  loading?: boolean
}

export function PurchasesSummary({
  totalPurchases,
  totalAmount,
  paidAmount,
  paidCount,
  unpaidAmount,
  unpaidCount,
  thisMonthAmount,
  thisMonthCount,
  uniqueSuppliersCount,
  averageOrder,
  currency = "KES",
  loading = false,
}: PurchasesSummaryProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-28 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-36 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-40 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const paidPercentage = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : "0.0"
  const unpaidPercentage = totalAmount > 0 ? ((unpaidAmount / totalAmount) * 100).toFixed(1) : "0.0"

  return (
    <div className="space-y-4">
      {/* Primary KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground">Total purchase orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount, currency)}</div>
            <p className="text-xs text-muted-foreground">All-time procurement cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(thisMonthAmount, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {thisMonthCount} order{thisMonthCount === 1 ? "" : "s"} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSuppliersCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalPurchases > 0
                ? `Avg. order: ${formatCurrency(averageOrder, currency)}`
                : "No orders placed"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Paid vs Unpaid Purchases Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/50 via-background to-background dark:from-emerald-950/20 dark:via-background dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
              Paid Purchases
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(paidAmount, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidCount} order{paidCount === 1 ? "" : "s"} fully settled • {paidPercentage}% of total purchases
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200/70 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/50 via-background to-background dark:from-rose-950/20 dark:via-background dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-900 dark:text-rose-300">
              Unpaid Purchases
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(unpaidAmount, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unpaidCount} order{unpaidCount === 1 ? "" : "s"} pending / on credit • {unpaidPercentage}% of total purchases
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
