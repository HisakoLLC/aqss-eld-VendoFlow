import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ShoppingBag, DollarSign, Calendar, Users } from "lucide-react"

type PurchasesSummaryProps = {
  totalPurchases: number
  totalAmount: number
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
  thisMonthAmount,
  thisMonthCount,
  uniqueSuppliersCount,
  averageOrder,
  currency = "KES",
  loading = false,
}: PurchasesSummaryProps) {
  if (loading) {
    return (
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
    )
  }

  return (
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
  )
}
