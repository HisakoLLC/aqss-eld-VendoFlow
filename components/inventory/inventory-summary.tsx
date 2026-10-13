import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Package, Layers, TrendingUp, AlertTriangle } from "lucide-react"

type InventorySummaryProps = {
  totalProducts: number
  totalQuantity: number
  totalRetailValue: number
  totalCostValue: number
  lowStockCount: number
  outOfStockCount: number
  currency?: string
  loading?: boolean
}

export function InventorySummary({
  totalProducts,
  totalQuantity,
  totalRetailValue,
  totalCostValue,
  lowStockCount,
  outOfStockCount,
  currency = "KES",
  loading = false,
}: InventorySummaryProps) {
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

  const inStockCount = Math.max(0, totalProducts - outOfStockCount)
  const hasAlerts = lowStockCount > 0 || outOfStockCount > 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            {totalProducts === 0
              ? "No products cataloged"
              : `${inStockCount} active in stock`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Units available on hand</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRetailValue, currency)}</div>
          <p className="text-xs text-muted-foreground">
            Cost: {formatCurrency(totalCostValue, currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${
              outOfStockCount > 0
                ? "text-red-500"
                : lowStockCount > 0
                  ? "text-orange-500"
                  : "text-muted-foreground"
            }`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              outOfStockCount > 0
                ? "text-red-600 dark:text-red-400"
                : lowStockCount > 0
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-green-600 dark:text-green-400"
            }`}
          >
            {hasAlerts ? lowStockCount + outOfStockCount : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {outOfStockCount > 0
              ? `${outOfStockCount} out of stock, ${lowStockCount} low (< 10)`
              : lowStockCount > 0
                ? `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} low stock (< 10)`
                : "All items well-stocked"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
