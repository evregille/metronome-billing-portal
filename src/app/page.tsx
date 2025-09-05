"use client";

import { useState, useEffect } from "react";
import { CustomerProvider, useCustomer } from "@/contexts/customer-context";
import { MetronomeProvider } from "@/hooks/use-metronome-config";
import { Balance } from "@/components/dashboard/balance";
import { Spend } from "@/components/dashboard/spend";
import { Invoices } from "@/components/dashboard/invoices";
import { CostBreakdownChart } from "@/components/charts/cost-breakdown-chart";
import { CallDetailsCSV } from "@/components/dashboard/call-details-csv";
import { CustomerSelector } from "@/components/customer-selector";

function DashboardContent() {
  const { selectedCustomer } = useCustomer();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Loading...</h2>
          <p className="text-white/80">Initializing AlphaSense Billing Dashboard</p>
        </div>
      </div>
    );
  }

  if (!selectedCustomer) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">No Customer Selected</h2>
          <p className="text-white/80">Please select a customer from the dropdown above</p>
        </div>
      </div>
    );
  }

  return (
    <MetronomeProvider customerId={selectedCustomer.metronome_customer_id}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <header className="glass-card border-b border-white/20">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    AlphaSense
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">Billing Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CustomerSelector />
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
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {selectedCustomer.name}! 👋
            </h2>
            <p className="text-gray-600 text-lg">Here&apos;s your billing overview for today</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Balance />
            <Spend />
          </div>

          {/* Invoices - Full Width */}
          <div className="mb-8">
            <Invoices />
          </div>

          {/* Cost Breakdown Chart - Full Width */}
          <div className="mb-8">
            <CostBreakdownChart />
          </div>

          {/* Call Details */}
          <div className="mb-8">
            <CallDetailsCSV />
          </div>
        </main>
      </div>
    </MetronomeProvider>
  );
}

export default function Home() {
  return (
    <CustomerProvider>
      <DashboardContent />
    </CustomerProvider>
  );
}
