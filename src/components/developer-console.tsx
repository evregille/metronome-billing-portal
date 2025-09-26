"use client";

import { useState } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";

interface Tab {
  id: string;
  label: string;
  data: any;
  hasData: boolean;
}

export function DeveloperConsole() {
  const { config } = useMetronome();
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
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

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
        {activeTabData?.hasData ? (
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
