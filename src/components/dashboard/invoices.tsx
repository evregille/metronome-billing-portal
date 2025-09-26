"use client";

import { useEffect, useState } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

export function Invoices() {
  const { 
    config, 
    invoices, 
    invoiceEmbeddableUrl, 
    fetchInvoiceEmbeddable, 
    fetchInvoices,
    loadingStates,
    isCustomerTransitioning
  } = useMetronome();
  
  const [showEmbeddable, setShowEmbeddable] = useState(false);

  useEffect(() => {
    (async () => {
      await fetchInvoices();
    })();
  }, [config, fetchInvoices]);

  useEffect(() => {
    if (showEmbeddable) {
      (async () => {
        await fetchInvoiceEmbeddable();
      })();
    }
  }, [showEmbeddable, config, fetchInvoiceEmbeddable]);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  // Sort invoices by date (most recent first), with DRAFT status prioritized
  const sortedInvoices = invoices ? [...invoices].sort((a, b) => {
    // First, prioritize DRAFT status
    if (a.status.toLowerCase() === 'draft' && b.status.toLowerCase() !== 'draft') {
      return -1;
    }
    if (a.status.toLowerCase() !== 'draft' && b.status.toLowerCase() === 'draft') {
      return 1;
    }
    
    // Then sort by end_timestamp (most recent first)
    const dateA = new Date(a.end_timestamp).getTime();
    const dateB = new Date(b.end_timestamp).getTime();
    return dateB - dateA; // Most recent first (descending order)
  }) : [];

  // Show loading state during customer transition
  if (isCustomerTransitioning) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoices</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View and manage your invoices</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Loading customer data...</p>
          </div>
        </div>
      </div>
    );
  }
console.log("sortedInvoices", sortedInvoices);
  return (
    <div className="glass-card card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoices</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and manage your invoices</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="invoice-embeddable-toggle"
            checked={showEmbeddable}
            onCheckedChange={setShowEmbeddable}
          />
          <Label htmlFor="invoice-embeddable-toggle" className="text-sm text-gray-700 dark:text-gray-200">
            Show Embeddable
          </Label>
        </div>
      </div>

      {showEmbeddable ? (
        // Show embeddable iframe
        <div className="h-96">
          {loadingStates.invoiceEmbeddable ? (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Loading invoice dashboard...</p>
              </div>
            </div>
          ) : invoiceEmbeddableUrl ? (
            <div className="overflow-hidden bg-white dark:bg-gray-800 h-full rounded-lg">
              <iframe
                src={invoiceEmbeddableUrl}
                className="w-full h-full"
                title="Metronome Invoice Dashboard"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Unable to load invoice dashboard</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Please try refreshing the page</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Show invoices table
        <div>
          {loadingStates.invoices ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
              </div>
            </div>
          ) : sortedInvoices && sortedInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">End Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Total Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInvoices.map((invoice, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(invoice.start_timestamp)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(invoice.end_timestamp)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                        ${formatCurrency(invoice.total, invoice.currency_name).replace('$', '')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Placeholder for PDF download functionality
                            console.log('Download PDF for invoice:', invoice);
                          }}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No invoices found</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Invoices will appear here when available</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 