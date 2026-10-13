import { ProductsList } from "./products-list"

export function InventoryContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground">Track and manage your product stock and catalog</p>
      </div>
      <ProductsList />
    </div>
  )
}
