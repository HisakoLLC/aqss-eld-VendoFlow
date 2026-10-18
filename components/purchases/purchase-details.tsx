"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { Edit, FileDown, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { downloadPurchaseOrderPDF } from "@/lib/purchase-order-generator"
import { reconcilePurchasePayment } from "@/lib/purchase-utils"
import type { Purchase, PurchaseItem } from "./purchases-data-provider"

type PurchaseDetailsProps = {
  purchase: Purchase | null
  items: PurchaseItem[] | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}

export function PurchaseDetails({ purchase, items, open, onOpenChange, onEdit }: PurchaseDetailsProps) {
  const [downloading, setDownloading] = useState(false)

  if (!purchase) return null

  const handleDownloadPO = async () => {
    try {
      setDownloading(true)
      await downloadPurchaseOrderPDF({
        purchase,
        items: items || [],
      })
      toast({
        title: "Purchase Order Downloaded",
        description: `PO #${purchase.reference_number} downloaded successfully.`,
      })
    } catch (error) {
      console.error("Error generating PO PDF:", error)
      toast({
        title: "Download Failed",
        description: "Failed to generate Purchase Order PDF.",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const totalAmount = Number(purchase.total_amount) || 0
  const paymentStatus = purchase.payment_status || "Paid"
  const { amountPaid, amountDue } = reconcilePurchasePayment(purchase)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-xl">Purchase Details</DialogTitle>
            <span className="text-sm font-normal text-muted-foreground">
              {format(new Date(purchase.purchase_date), "PPP")}
            </span>
          </div>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <span>Reference #{purchase.reference_number}</span>
            <span>•</span>
            <StatusBadge status={paymentStatus} />
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-3">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-lg border">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</h4>
              <p className="text-sm font-medium mt-0.5">{purchase.supplier_name}</p>
              {purchase.supplier_phone && (
                <p className="text-xs text-muted-foreground">{purchase.supplier_phone}</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Status</h4>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={paymentStatus} />
                <span className="text-xs text-muted-foreground">({purchase.payment_method || "Cash"})</span>
              </div>
            </div>

            <div className="pt-2 border-t sm:border-t-0 sm:pt-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</h4>
              <p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(totalAmount)}</p>
            </div>

            <div className="pt-2 border-t sm:border-t-0 sm:pt-0">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(amountPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-muted-foreground">Balance Due:</span>
                <span
                  className={`font-semibold ${amountDue > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground"}`}
                >
                  {formatCurrency(amountDue)}
                </span>
              </div>
            </div>

            {purchase.agreement_terms && (
              <div className="col-span-1 sm:col-span-2 pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agreement / Credit Terms
                </h4>
                <p className="text-xs text-foreground mt-0.5">{purchase.agreement_terms}</p>
              </div>
            )}

            {purchase.notes && (
              <div className="col-span-1 sm:col-span-2 pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
                <p className="text-xs text-foreground mt-0.5">{purchase.notes}</p>
              </div>
            )}
          </div>

          <div className="mt-2">
            <h4 className="text-sm font-semibold mb-2">Order Items</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items && items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.product_name}</p>
                            {item.product_sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total_cost)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 sticky bottom-0 pt-3 border-t bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadPO}
            disabled={downloading}
            className="w-full sm:w-auto"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
            ) : (
              <FileDown className="mr-2 h-4 w-4 text-primary" />
            )}
            Download Purchase Order (PDF)
          </Button>

          <Button onClick={() => onEdit(purchase.id)} className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Edit Purchase
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
