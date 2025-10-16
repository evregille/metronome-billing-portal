"use client";

import { useState, useEffect } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";

interface Tab {
  id: string;
  label: string;
  data: any;
  hasData: boolean;
}

interface EmbeddableComponent {
  id: string;
  name: string;
  description: string;
  url: string;
}

export function DeveloperConsole() {
  const { 
    config, 
    invoiceEmbeddableUrl, 
    commitsEmbeddableUrl, 
    usageEmbeddableUrl,
    loadingStates,
    fetchInvoiceEmbeddable,
    fetchCommitsEmbeddable,
    fetchUsageEmbeddable
  } = useMetronome();
  const [activeTab, setActiveTab] = useState("customer");

  const tabs: Tab[] = [
    {
      id: "customer",
      label: "Customer",
      data: config.customer_details,
      hasData: !!config.customer_details,
    },
    {
      id: "contract",
      label: "Contract",
      data: config.contract_details,
      hasData: !!config.contract_details,
    },
    {
      id: "invoice",
      label: "Invoice",
      data: config.invoice_draft_details,
      hasData: !!config.invoice_draft_details,
    },
    {
      id: "invoice-breakdown",
      label: "Invoice Breakdown",
      data: config.invoice_breakdown_details,
      hasData: !!config.invoice_breakdown_details,
    },
    {
      id: "embeddable",
      label: "Embeddable Components",
      data: null,
      hasData: true,
    },
  ];

  const embeddableComponents: EmbeddableComponent[] = [
    {
      id: "commits",
      name: "Commits & Credits",
      description: "Display current account balance and credit information",
      url: commitsEmbeddableUrl || "",
    },
    {
      id: "usage",
      name: "Usage Analytics",
      description: "Show usage metrics and analytics charts",
      url: usageEmbeddableUrl || "",
    },
    {
      id: "invoices",
      name: "Invoice History",
      description: "Display invoice history and payment status",
      url: invoiceEmbeddableUrl || "",
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  // Auto-generate embeddable URLs when the embeddable tab is accessed
  useEffect(() => {
    if (activeTab === "embeddable") {
      // Generate all embeddable URLs automatically in light mode
      if (!commitsEmbeddableUrl) {
        fetchCommitsEmbeddable(true, true); // forceRefresh=true, forceLightMode=true
      }
      if (!usageEmbeddableUrl) {
        fetchUsageEmbeddable(true, true); // forceRefresh=true, forceLightMode=true
      }
      if (!invoiceEmbeddableUrl) {
        fetchInvoiceEmbeddable(true, true); // forceRefresh=true, forceLightMode=true
      }
    }
  }, [activeTab, commitsEmbeddableUrl, usageEmbeddableUrl, invoiceEmbeddableUrl, fetchCommitsEmbeddable, fetchUsageEmbeddable, fetchInvoiceEmbeddable]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Developer Console</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Raw JSON data from Metronome API responses
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }
                  ${!tab.hasData ? "opacity-50" : ""}
                `}
                disabled={!tab.hasData}
              >
                {tab.label}
                {!tab.hasData && (
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">(No data)</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "embeddable" ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Embeddable UI Components
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Embeddable URLs are automatically generated in light mode when you access this tab. Click on any component below to open it in a new window for embedding or testing.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {embeddableComponents.map((component) => {
                const isLoading = loadingStates[`${component.id}Embeddable` as keyof typeof loadingStates];
                const hasUrl = component.url && component.url.length > 0;
                
                const handleFetch = () => {
                  switch (component.id) {
                    case 'commits':
                      fetchCommitsEmbeddable(true, true); // forceRefresh=true, forceLightMode=true
                      break;
                    case 'usage':
                      fetchUsageEmbeddable(true, true); // forceRefresh=true, forceLightMode=true
                      break;
                    case 'invoices':
                      fetchInvoiceEmbeddable(true, true); // forceRefresh=true, forceLightMode=true
                      break;
                  }
                };

                return (
                  <div
                    key={component.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {component.name}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          {component.description}
                        </p>
                        <div className="flex items-center space-x-2 mb-3">
                          {hasUrl ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded truncate max-w-xs">
                              {component.url}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                              URL not generated yet
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!hasUrl && (
                            <button
                              onClick={handleFetch}
                              disabled={isLoading}
                              className="text-xs bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? "Generating..." : "Generate URL"}
                            </button>
                          )}
                          {hasUrl && (
                            <button
                              onClick={() => window.open(component.url, '_blank', 'noopener,noreferrer')}
                              className="text-xs bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 px-3 py-1 rounded transition-colors"
                            >
                              Open in New Window
                            </button>
                          )}
                        </div>
                      </div>
                      {hasUrl && (
                        <button
                          onClick={() => window.open(component.url, '_blank', 'noopener,noreferrer')}
                          className="ml-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          title="Open in new window"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Embedding Instructions
              </h5>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                To embed these components in your application, use an iframe with the generated URLs above:
              </p>
              <pre className="text-xs text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-800/50 p-2 rounded overflow-x-auto">
{`<iframe 
  src="[GENERATED_URL_FROM_ABOVE]"
  width="100%" 
  height="400"
  frameborder="0">
</iframe>`}
              </pre>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Note: Embeddable URLs are automatically generated in light mode when you access this tab. All URLs are optimized for embedding in external applications.
              </p>
            </div>
          </div>
        ) : activeTabData?.hasData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {activeTabData.label} Data
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Array.isArray(activeTabData.data) 
                    ? `${activeTabData.data.length} items`
                    : "1 object"
                  }
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(activeTabData.data, null, 2));
                  }}
                  className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors"
                >
                  Copy JSON
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {JSON.stringify(activeTabData.data, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              No {activeTabData?.label} data available
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTabData?.id === "customer" && "Select a customer to view details"}
              {activeTabData?.id === "contract" && "Select a contract to view details"}
              {activeTabData?.id === "invoice" && "Fetch current spend to view invoice data"}
              {activeTabData?.id === "invoice-breakdown" && "Fetch costs to view invoice breakdown data"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
