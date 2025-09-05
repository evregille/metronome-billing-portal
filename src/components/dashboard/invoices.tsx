"use client";

import { useEffect } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { FileText, ExternalLink, Loader2 } from "lucide-react";

export function Invoices() {
  const { config, invoiceEmbeddableUrl, fetchInvoiceEmbeddable, loadingStates } = useMetronome();

  useEffect(() => {
    (async () => {
      await fetchInvoiceEmbeddable();
    })();
  }, [config, fetchInvoiceEmbeddable]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
            <p className="text-sm text-gray-600">View and manage your invoices</p>
          </div>
        </div>
        {invoiceEmbeddableUrl && (
          <a
            href={invoiceEmbeddableUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">Open in New Tab</span>
          </a>
        )}
      </div>

      <div className="relative">
        {loadingStates.invoiceEmbeddable ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-gray-600">Loading invoice dashboard...</p>
            </div>
          </div>
        ) : invoiceEmbeddableUrl ? (
          <iframe
            src={invoiceEmbeddableUrl}
            className="w-full h-96 border-0 rounded-lg shadow-sm"
            title="Metronome Invoice Dashboard"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Unable to load invoice dashboard</p>
              <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 