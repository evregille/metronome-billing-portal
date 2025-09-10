"use client";

import { useState, useEffect } from "react";
import { CustomerProvider, useCustomer } from "@/contexts/customer-context";
import { MetronomeProvider } from "@/hooks/use-metronome-config";
import { Balance } from "@/components/dashboard/balance";
import { Spend } from "@/components/dashboard/spend";
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
                Powered by Metronome
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
