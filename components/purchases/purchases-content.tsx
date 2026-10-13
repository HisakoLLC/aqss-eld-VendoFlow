import { PurchasesList } from "./purchases-list"

export function PurchasesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Purchases</h2>
        <p className="text-muted-foreground">Track and manage your supplier purchases and procurement</p>
      </div>
      <PurchasesList />
    </div>
  )
}
