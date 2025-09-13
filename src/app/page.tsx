"use client";

import { useState, useEffect } from "react";
import { CustomerProvider, useCustomer } from "@/contexts/customer-context";
import { MetronomeProvider } from "@/hooks/use-metronome-config";
import { Balance } from "@/components/dashboard/balance";
import { Spend } from "@/components/dashboard/spend";
import { Usage } from "@/components/dashboard/usage";
import { Invoices } from "@/components/dashboard/invoices";
import { CostBreakdownChart } from "@/components/charts/cost-breakdown-chart";
import { CustomerSelector } from "@/components/customer-selector";
import { SettingsModal } from "@/components/settings-modal";

const BUSINESS_NAME_STORAGE_KEY = "business_name";

// Get default business name from environment variable
const DEFAULT_BUSINESS_NAME = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_NAME || "AcmeCorp";

function DashboardContent() {
  const { selectedCustomer, loading } = useCustomer();
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);

  useEffect(() => {
    // Load settings from localStorage on mount
    const storedApiKey = localStorage.getItem("metronome_api_key");
    const storedBusinessName = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
    
    setApiKey(storedApiKey || undefined);
    setBusinessName(storedBusinessName || DEFAULT_BUSINESS_NAME);
    setIsLoading(false);
  }, []);

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey || undefined);
    // Trigger a page refresh to reload data with new API key
    if (newApiKey) {
      window.location.reload();
    }
  };

  const handleBusinessNameChange = (newBusinessName: string) => {
    setBusinessName(newBusinessName);
    // No need to refresh the page for business name changes
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-white font-bold text-2xl">{businessName.charAt(0)}</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Loading...</h2>
          <p className="text-white/80">Initializing {businessName} Billing Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="glass-card border-b border-white/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">{businessName.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {businessName}
                </h1>
                <p className="text-sm text-gray-600 font-medium">Billing Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CustomerSelector />
              <SettingsModal 
                onApiKeyChange={handleApiKeyChange}
                onBusinessNameChange={handleBusinessNameChange}
              />
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2"></span>
                Connected
              </div>
              <div className="text-sm text-gray-600">
                <a 
                  href="https://github.com/evregille/metronome-billing-portal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-800 transition-colors duration-200 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Powered by Metronome</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {selectedCustomer ? (
          <MetronomeProvider customerId={selectedCustomer.metronome_customer_id} apiKey={apiKey}>
            <div className="space-y-8">
              {/* Top Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Balance />
                <Spend />
              </div>

              {/* Cost Breakdown */}
              <CostBreakdownChart />

              {/* Usage Analytics */}
              <Usage />

              {/* Invoices */}
              <Invoices />

            </div>
          </MetronomeProvider>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Customers</h3>
              <p className="text-gray-600">Fetching customer data from Metronome...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <CustomerProvider>
      <DashboardContent />
    </CustomerProvider>
  );
}
