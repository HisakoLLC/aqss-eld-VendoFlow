"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Edit, Trash2, Search, Plus, FileDown, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PurchaseDetails } from "./purchase-details"
import { PurchasesSummary } from "./purchases-summary"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/utils"
import { downloadPurchaseOrderPDF } from "@/lib/purchase-order-generator"
import {
  getPurchasesData,
  getPurchaseById,
  deletePurchase,
  type Purchase,
  type PurchaseItem,
} from "./purchases-data-provider"

export function PurchasesList() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [selectedPurchaseItems, setSelectedPurchaseItems] = useState<PurchaseItem[] | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    fetchPurchases()
  }, [])

  useEffect(() => {
    let result = purchases

    // Filter by payment status
    if (statusFilter !== "all") {
      result = result.filter((p) => {
        const s = (p.payment_status || "Paid").toLowerCase().trim()
        if (statusFilter === "paid") {
          return s === "paid" || s === "fully paid"
        }
        if (statusFilter === "partial") {
          return s.includes("part")
        }
        if (statusFilter === "credit") {
          return s.includes("credit") || s.includes("agree")
        }
        if (statusFilter === "unpaid") {
          return s.includes("unpaid")
        }
        return true
      })
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (purchase) =>
          purchase.reference_number.toLowerCase().includes(query) ||
          purchase.supplier_name?.toLowerCase().includes(query),
      )
    }

    setFilteredPurchases(result)
  }, [searchQuery, statusFilter, purchases])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const data = await getPurchasesData()
      setPurchases(data)
      setFilteredPurchases(data)
    } catch (error) {
      console.error("Error fetching purchases:", error)
      toast({
        title: "Error",
        description: "Failed to load purchases data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (id: string) => {
    try {
      const data = await getPurchaseById(id)
      if (data) {
        setSelectedPurchase(data.purchase)
        setSelectedPurchaseItems(data.items)
        setDetailsOpen(true)
      } else {
        throw new Error("Failed to load purchase details")
      }
    } catch (error) {
      console.error("Error fetching purchase details:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase details",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPO = async (purchase: Purchase) => {
    try {
      setDownloadingId(purchase.id)
      const data = await getPurchaseById(purchase.id)
      if (!data) {
        throw new Error("Failed to load purchase details for PDF")
      }

      await downloadPurchaseOrderPDF({
        purchase: data.purchase,
        items: data.items,
      })

      toast({
        title: "Purchase Order Downloaded",
        description: `PO #${purchase.reference_number} downloaded successfully.`,
      })
    } catch (error) {
      console.error("Error downloading purchase order:", error)
      toast({
        title: "Download Failed",
        description: "Could not generate purchase order PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setPurchaseToDelete(id)
  }

  const handleConfirmDelete = async () => {
    if (!purchaseToDelete) return

    try {
      const result = await deletePurchase(purchaseToDelete)

      if (result.success) {
        // Update local state
        setPurchases(purchases.filter((purchase) => purchase.id !== purchaseToDelete))
        toast({
          title: "Purchase deleted",
          description: "The purchase has been successfully deleted",
        })
      } else {
        throw new Error("Failed to delete purchase")
      }
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast({
        title: "Error",
        description: "Failed to delete purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPurchaseToDelete(null)
    }
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const totalPurchases = purchases.length
  const totalAmount = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)

  const thisMonthPurchases = purchases.filter((p) => {
    if (!p.purchase_date) return false
    const d = new Date(p.purchase_date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const thisMonthAmount = thisMonthPurchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)
  const thisMonthCount = thisMonthPurchases.length

  const supplierSet = new Set(
    purchases
      .map((p) => p.supplier_name || p.supplier_id)
      .filter(Boolean)
  )
  const uniqueSuppliersCount = supplierSet.size
  const averageOrder = totalPurchases > 0 ? totalAmount / totalPurchases : 0

  // Status Counts
  const paidCount = purchases.filter((p) => {
    const s = (p.payment_status || "Paid").toLowerCase()
    return (s === "paid" || s === "fully paid") && !s.includes("part") && !s.includes("unpaid")
  }).length

  const partialCount = purchases.filter((p) => {
    const s = (p.payment_status || "").toLowerCase()
    return s.includes("part")
  }).length

  const creditCount = purchases.filter((p) => {
    const s = (p.payment_status || "").toLowerCase()
    return s.includes("credit") || s.includes("agree")
  }).length

  const unpaidCount = purchases.filter((p) => {
    const s = (p.payment_status || "").toLowerCase()
    return s.includes("unpaid")
  }).length

  return (
    <div className="space-y-6">
      <PurchasesSummary
        totalPurchases={totalPurchases}
        totalAmount={totalAmount}
        thisMonthAmount={thisMonthAmount}
        thisMonthCount={thisMonthCount}
        uniqueSuppliersCount={uniqueSuppliersCount}
        averageOrder={averageOrder}
        loading={loading}
      />

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search purchases or suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <Link href="/purchases/new">
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Purchase
            </Button>
          </Link>
        </div>

        {/* Status Filter Badges/Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium mr-1">Status:</span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All ({totalPurchases})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("paid")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
            }`}
          >
            Paid ({paidCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("partial")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              statusFilter === "partial"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60"
            }`}
          >
            Partial ({partialCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("credit")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              statusFilter === "credit"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60"
            }`}
          >
            On Credit / Agreement ({creditCount})
          </button>
          {unpaidCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter("unpaid")}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                statusFilter === "unpaid"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60"
              }`}
            >
              Unpaid ({unpaidCount})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">Loading purchases...</div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 border rounded-lg">
          <p className="text-muted-foreground mb-4">No purchase records found</p>
          <Link href="/purchases/new">
            <Button>Create your first purchase</Button>
          </Link>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border rounded-lg">
          <p className="text-muted-foreground">No purchases match your search or filter</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.reference_number}</TableCell>
                  <TableCell>{purchase.supplier_name}</TableCell>
                  <TableCell>{format(new Date(purchase.purchase_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(purchase.total_amount)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={purchase.payment_status || "Paid"} />
                      {purchase.payment_status === "Partial" && (purchase.amount_due ?? 0) > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          Due: {formatCurrency(purchase.amount_due ?? 0)}
                        </span>
                      )}
                      {(purchase.payment_status === "Credit" || purchase.payment_status === "Agreement") &&
                        purchase.agreement_terms && (
                          <span
                            className="text-[11px] text-muted-foreground truncate max-w-[150px]"
                            title={purchase.agreement_terms}
                          >
                            {purchase.agreement_terms}
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadPO(purchase)}
                        disabled={downloadingId === purchase.id}
                        title="Download Purchase Order (PDF)"
                        className="text-slate-600 hover:text-primary hover:bg-primary/10"
                      >
                        {downloadingId === purchase.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Download PO</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(purchase.id)}
                        title="View Purchase Details"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Link href={`/purchases/${purchase.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Edit Purchase">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(purchase.id)}
                        title="Delete Purchase"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!purchaseToDelete} onOpenChange={(open) => !open && setPurchaseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase? This action cannot be undone and will revert inventory
              changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Details Modal */}
      <PurchaseDetails
        purchase={selectedPurchase}
        items={selectedPurchaseItems}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={(id) => {
          setDetailsOpen(false)
          window.location.href = `/purchases/${id}/edit`
        }}
      />
    </div>
  )
}
