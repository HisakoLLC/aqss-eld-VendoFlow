"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Edit, ArrowLeft, Trash2, FileDown, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { getPurchaseById, deletePurchase } from "@/components/purchases/purchases-data-provider"
import { StatusBadge } from "@/components/ui/status-badge"
import { downloadPurchaseOrderPDF } from "@/lib/purchase-order-generator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PurchaseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const purchaseId = params.id as string
  const [purchase, setPurchase] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    // If the ID is "new", redirect to the new purchase page
    if (purchaseId === "new") {
      router.push("/purchases/new")
      return
    }

    fetchPurchaseDetails()
  }, [purchaseId, router])

  const fetchPurchaseDetails = async () => {
    try {
      setLoading(true)
      const data = await getPurchaseById(purchaseId)
      if (data) {
        setPurchase(data.purchase)
        setItems(data.items)
      } else {
        toast({
          title: "Error",
          description: "Failed to load purchase details",
          variant: "destructive",
        })
        router.push("/purchases")
      }
    } catch (error) {
      console.error("Error fetching purchase details:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase details",
        variant: "destructive",
      })
      router.push("/purchases")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPO = async () => {
    if (!purchase) return
    try {
      setDownloading(true)
      await downloadPurchaseOrderPDF({
        purchase,
        items,
      })
      toast({
        title: "Purchase Order Downloaded",
        description: `PO #${purchase.reference_number} downloaded successfully.`,
      })
    } catch (error) {
      console.error("Error generating purchase order PDF:", error)
      toast({
        title: "Download Failed",
        description: "Failed to generate Purchase Order PDF.",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const result = await deletePurchase(purchaseId)

      if (result.success) {
        toast({
          title: "Purchase deleted",
          description: "The purchase has been successfully deleted",
        })
        router.push("/purchases")
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
      setDeleteDialogOpen(false)
    }
  }

  // If the ID is "new", we'll redirect in the useEffect
  if (purchaseId === "new") {
    return null
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading purchase details...</div>
  }

  if (!purchase) {
    return <div className="flex justify-center p-8">Purchase not found</div>
  }

  const totalAmount = Number(purchase.total_amount) || 0
  const paymentStatus = purchase.payment_status || "Paid"
  const amountPaid =
    purchase.amount_paid !== null && purchase.amount_paid !== undefined
      ? Number(purchase.amount_paid)
      : paymentStatus === "Paid"
        ? totalAmount
        : 0
  const amountDue =
    purchase.amount_due !== null && purchase.amount_due !== undefined
      ? Number(purchase.amount_due)
      : Math.max(0, totalAmount - amountPaid)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/purchases")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchases
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadPO} disabled={downloading}>
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
            ) : (
              <FileDown className="mr-2 h-4 w-4 text-primary" />
            )}
            Download Purchase Order (PDF)
          </Button>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="text-red-500 hover:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button onClick={() => router.push(`/purchases/${purchaseId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Purchase
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Purchase Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order</CardTitle>
            <CardDescription>Reference #{purchase.reference_number}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Date</dt>
                <dd className="text-sm">{format(new Date(purchase.purchase_date), "PPP")}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Supplier</dt>
                <dd className="text-sm font-medium">{purchase.supplier_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Total Order Amount</dt>
                <dd className="text-base font-bold">{formatCurrency(totalAmount)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Items Count</dt>
                <dd className="text-sm">{items.length} product{items.length === 1 ? "" : "s"}</dd>
              </div>
              {purchase.notes && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                  <dd className="text-sm text-foreground">{purchase.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Card 2: Payment & Terms Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Terms</CardTitle>
            <CardDescription>Payment status and financial reconciliation</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Payment Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={paymentStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Payment Method</dt>
                <dd className="text-sm font-medium">{purchase.payment_method || "Cash"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Amount Paid</dt>
                <dd className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(amountPaid)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Balance Due</dt>
                <dd className={`text-sm font-bold ${amountDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                  {formatCurrency(amountDue)}
                </dd>
              </div>
              {purchase.agreement_terms && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Credit / Agreement Terms</dt>
                  <dd className="text-sm text-foreground bg-muted/40 p-2.5 rounded-md border mt-1">
                    {purchase.agreement_terms}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Items</CardTitle>
            <CardDescription>Products included in this purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>{item.product_sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                      <TableCell>{formatCurrency(item.total_cost)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase? This action cannot be undone and will revert inventory
              changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
