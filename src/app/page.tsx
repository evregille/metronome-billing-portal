"use client";

import { useState, useEffect } from "react";
import { CustomerProvider, useCustomer } from "@/contexts/customer-context";
import { MetronomeProvider, useMetronome } from "@/hooks/use-metronome-config";
import { Balance } from "@/components/dashboard/balance";
import { Spend } from "@/components/dashboard/spend";
import { Usage } from "@/components/dashboard/usage";
import { Invoices } from "@/components/dashboard/invoices";
import { CostBreakdownChart } from "@/components/charts/cost-breakdown-chart";
import { CustomerSelector } from "@/components/customer-selector";
import { ContractSelector } from "@/components/contract-selector";
import { SettingsModal } from "@/components/settings-modal";
import { ManagedSubscription } from "@/components/managed-subscription";
import { PaymentMethod } from "@/components/payment-method";
import { DeveloperConsole } from "@/components/developer-console";
import { RefreshCw, CreditCard, BarChart3, Settings, Receipt, Code, Moon, Sun } from "lucide-react";

const BUSINESS_NAME_STORAGE_KEY = "business_name";

// Get default business name from environment variable
const DEFAULT_BUSINESS_NAME = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_NAME || "AcmeCorp";

// Dark Mode Toggle Component
function DarkModeToggle() {
  const [isDark, setIsDark] = useState(true); // Default to dark mode

  useEffect(() => {
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && true); // Default to dark mode
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    
    // Dispatch custom event to notify components of theme change
    window.dispatchEvent(new CustomEvent('themeChanged'));
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center w-10 h-10 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-all duration-200"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}

// Refresh Button Component
function RefreshButton() {
  const { 
    fetchBalance, 
    fetchCosts, 
    fetchCurrentSpend, 
    fetchAlerts, 
    fetchInvoices, 
    fetchRawUsageData,
    fetchCustomerDetails,
    fetchContractDetails,
    config,
    loadingStates 
  } = useMetronome();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Prepare array of fetch functions with force refresh for cached data
      const fetchFunctions = [
        fetchBalance(),
        fetchCosts(true), // Force refresh to bypass cache
        fetchCurrentSpend(),
        fetchAlerts(),
        fetchInvoices(true), // Force refresh to bypass cache
        fetchRawUsageData(true), // Force refresh to bypass cache
      ];

      // Always add fetchCustomerDetails if customer_id is available
      if (config.customer_id) {
        fetchFunctions.push(fetchCustomerDetails());
      }

      // Only add fetchContractDetails if contract_id is available
      if (config.contract_id) {
        fetchFunctions.push(fetchContractDetails());
      }

      // Fetch all data in parallel for better performance
      await Promise.all(fetchFunctions);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isAnyLoading = Object.values(loadingStates).some(loading => loading);

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing || isAnyLoading}
      className="flex items-center space-x-2 px-3 py-2 bg-white/80 hover:bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Refresh all data"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  );
}

// Dashboard Header with Refresh Button
function DashboardHeader({ 
  businessName, 
  onApiKeyChange, 
  onBusinessNameChange, 
  onRechargeProductIdChange 
}: {
  businessName: string;
  onApiKeyChange: (key: string) => void;
  onBusinessNameChange: (name: string) => void;
  onRechargeProductIdChange: (id: string) => void;
}) {
  return (
    <header className="glass-card border-b border-white/20 dark:border-gray-800/20">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">{businessName.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {businessName}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Billing Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <CustomerSelector />
            <ContractSelector />
            <RefreshButton />
            <DarkModeToggle />
            <SettingsModal 
              onApiKeyChange={onApiKeyChange}
              onBusinessNameChange={onBusinessNameChange}
              onRechargeProductIdChange={onRechargeProductIdChange}
            />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <a 
                href="https://github.com/evregille/metronome-billing-portal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 flex items-center space-x-1"
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
  );
}

// Component to handle customer and contract selection and fetch their details
function CustomerAndContractHandler({ children }: { children: React.ReactNode }) {
  const { selectedCustomer, selectedContract } = useCustomer();
  const { fetchCustomerDetails, fetchContractDetails } = useMetronome();

  // Fetch customer details when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerDetails();
    }
  }, [selectedCustomer, fetchCustomerDetails]);

  // Fetch contract details when contract changes
  useEffect(() => {
    if (selectedContract) {
      fetchContractDetails();
    }
  }, [selectedContract, fetchContractDetails]);

  return <>{children}</>;
}

// Component to handle the conditional developer console layout
function DeveloperConsoleLayout() {
  // Show only DeveloperConsole component
  return <DeveloperConsole />;
}

// Tab component for organizing dashboard sections
function TabButton({ 
  label, 
  icon: Icon, 
  isActive, 
  onClick 
}: { 
  label: string; 
  icon: any; 
  isActive: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        isActive
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function DashboardContent() {
  const { selectedCustomer, selectedContract, loading, } = useCustomer();
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);
  const [rechargeProductId, setRechargeProductId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("billing");

  useEffect(() => {
    // Load settings from localStorage on mount
    const storedApiKey = localStorage.getItem("metronome_api_key");
    const storedBusinessName = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
    const storedRechargeProductId = localStorage.getItem("recharge_product_id");
    
    setApiKey(storedApiKey || undefined);
    setBusinessName(storedBusinessName || DEFAULT_BUSINESS_NAME);
    setRechargeProductId(storedRechargeProductId || "");
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

  const handleRechargeProductIdChange = (newRechargeProductId: string) => {
    setRechargeProductId(newRechargeProductId);
    // No need to refresh the page for recharge product ID changes
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-white font-bold text-2xl">{businessName.charAt(0)}</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Loading...</h2>
          <p className="text-white/80">Initializing {businessName} Billing Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header for when no customer is selected */}
      {!selectedCustomer && (
        <header className="glass-card border-b border-white/20 dark:border-gray-800/20">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">{businessName.charAt(0)}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    {businessName}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Billing Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CustomerSelector />
                <ContractSelector />
                <SettingsModal 
                  onApiKeyChange={handleApiKeyChange}
                  onBusinessNameChange={handleBusinessNameChange}
                  onRechargeProductIdChange={handleRechargeProductIdChange}
                />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <a 
                    href="https://github.com/evregille/metronome-billing-portal" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 flex items-center space-x-1"
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
      )}

      {/* Main Content */}
      <main>
        {selectedCustomer ? (
          <MetronomeProvider 
            customerId={selectedCustomer.metronome_customer_id} 
            contractId={selectedContract?.id}
            apiKey={apiKey}
            rechargeProductId={rechargeProductId}
          >
            <CustomerAndContractHandler>
              <DashboardHeader 
                businessName={businessName}
                onApiKeyChange={handleApiKeyChange}
                onBusinessNameChange={handleBusinessNameChange}
                onRechargeProductIdChange={handleRechargeProductIdChange}
              />
              <div className="container mx-auto px-6 py-8">
                {/* Tab Navigation */}
                <div className="mb-8">
                  <div className="flex flex-wrap gap-2">
                    <TabButton
                      label="Billing"
                      icon={CreditCard}
                      isActive={activeTab === "billing"}
                      onClick={() => setActiveTab("billing")}
                    />
                    <TabButton
                      label="Usage"
                      icon={BarChart3}
                      isActive={activeTab === "usage"}
                      onClick={() => setActiveTab("usage")}
                    />
                    <TabButton
                      label="Subscriptions"
                      icon={Settings}
                      isActive={activeTab === "subscriptions"}
                      onClick={() => setActiveTab("subscriptions")}
                    />
                    <TabButton
                      label="Payments"
                      icon={Receipt}
                      isActive={activeTab === "payments"}
                      onClick={() => setActiveTab("payments")}
                    />
                    <TabButton
                      label="Developer"
                      icon={Code}
                      isActive={activeTab === "developer"}
                      onClick={() => setActiveTab("developer")}
                    />
                  </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-8">
                  {activeTab === "billing" && (
                    <>
                      {/* Billing Tab - Account Balance, Spend, and Cost Breakdown */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Balance />
                        <Spend />
                      </div>
                      <CostBreakdownChart />
                    </>
                  )}

                  {activeTab === "usage" && (
                    <>
                      {/* Usage Tab - Usage Analytics */}
                      <Usage />
                    </>
                  )}

                  {activeTab === "subscriptions" && (
                    <>
                      {/* Subscriptions Tab */}
                      <ManagedSubscription />
                    </>
                  )}

                  {activeTab === "payments" && (
                    <>
                      {/* Payments Tab - Invoices and Payment Method */}
                      <Invoices />
                      <PaymentMethod />
                    </>
                  )}

                  {activeTab === "developer" && (
                    <>
                      {/* Developer Tab */}
                      <DeveloperConsoleLayout />
                    </>
                  )}
                </div>
              </div>
            </CustomerAndContractHandler>
          </MetronomeProvider>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Customers</h3>
              <p className="text-gray-600">Fetching customer data from Metronome...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customers Found</h3>
              <p className="text-gray-600 mb-4">
                No customers were found for the current API key. Please check your API key or create a customer in Metronome.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
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
