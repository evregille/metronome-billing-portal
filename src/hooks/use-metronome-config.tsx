"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createCustomerSpendAlert,
  createCustomerBalanceAlert,
  createCustomerCommitPercentageAlert,
  deleteCustomerAlert,
  createMetronomeEmbeddableLink,
  fetchCurrentSpendDraftInvoice,
  fetchCustomerAlerts,
  fetchCustomerInvoices,
  fetchMetronomeCustomerBalance,
  fetchMetronomeInvoiceBreakdown,
  fetchRawUsageData as fetchRawUsageDataAction,
  rechargeBalance as rechargeBalanceAction,
  updateAutoRecharge as updateAutoRechargeAction,
  updateThresholdBalance as updateThresholdBalanceAction,
  fetchBillableMetric as fetchBillableMetricAction,
  sendUsageData as sendUsageDataAction,
  previewEvents as previewEventsAction,
  updateSubscriptionQuantity as updateSubscriptionQuantityAction,
  retrieveContractDetails as retrieveContractDetailsAction,
  fetchCustomerDetails as fetchCustomerDetailsAction,
} from "@/actions/metronome";

// Utility function to detect current theme
function getCurrentTheme(): string {
  if (typeof window === 'undefined') return 'dark'; // Default to dark mode
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  
  // Default to dark mode instead of light mode
  return 'dark';
}

// Types based on the backend API
interface MetronomeConfig {
  customer_id: string;
  contract_id?: string;
  customer_details?: any;
  contract_details?: any;
  invoice_draft_details?: any;
  invoice_breakdown_details?: any;
}

interface Balance {
  total_granted: number;
  total_used: number;
  currency_name: string;
  currency_id: string;
  processed_grants: Array<{
    id: string;
    type: string;
    product_name: string;
    granted: number;
    used: number;
    remaining: number;
  }>;
}

interface BreakdownData {
  currency_name: string;
  products: Record<string, any>;
  items: Array<{
    id: string;
    starting_on: string;
    ending_before: string;
    line_items: Array<{
      id: string;
      name: string;
      product_name: string;
      product_type: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
  }>;
}

interface CurrentSpend {
  total: Record<string, number>;
  productTotals: Record<string, { 
    total: number; 
    currency_name: string;
    balanceDrawdown: number;
    overages: number;
    type: string;
  }>;
  commitApplicationTotals: Record<string, { total: number; currency_name: string }>;
}

interface InvoiceListItem {
  start_timestamp: string;
  end_timestamp: string;
  total: number;
  status: string;
  currency_name: string;
}

interface AlertData {
  id?: string;
  customer_status: string | null;
  alert: {
    id: string;
    type: string;
    name: string;
    threshold?: number;
    enabled?: boolean;
    status?: string;
  };
}

interface AlertsResult {
  balanceAlert: AlertData | null;
  spendAlert: AlertData | null;
  commitPercentageAlert: AlertData | null;
}

interface UsageDataEntry {
  timestamp: string;
  value: number;
  [key: string]: any;
}

interface BillableMetricUsage {
  billable_metric: {
    id: string;
    name: string;
  };
  raw_usage_data: UsageDataEntry[];
  aggregated_value: number;
  total_entries: number;
  error?: string;
}

interface RawUsageData {
  customer_id: string;
  total_metrics: number;
  usage_data: BillableMetricUsage[];
}



interface LoadingStates {
  balance: boolean;
  costs: boolean;
  currentSpend: boolean;
  alerts: boolean;
  invoiceEmbeddable: boolean;
  commitsEmbeddable: boolean;
  usageEmbeddable: boolean;
  invoices: boolean;
  rawUsageData: boolean;
  customerDetails: boolean;
  contractDetails: boolean;
}

interface MetronomeContextType {
  config: MetronomeConfig;
  balance: Balance | null;
  costs: BreakdownData | null;
  currentSpend: CurrentSpend | null;
  alerts: AlertsResult | null;
  invoices: InvoiceListItem[] | null;
  rawUsageData: RawUsageData | null;
  invoiceEmbeddableUrl: string | null;
  commitsEmbeddableUrl: string | null;
  usageEmbeddableUrl: string | null;
  loadingStates: LoadingStates;
  isCustomerTransitioning: boolean;
  rechargeProductId?: string;
  fetchBalance: () => Promise<void>;
  fetchCosts: (forceRefresh?: boolean) => Promise<void>;
  fetchCurrentSpend: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchInvoices: (forceRefresh?: boolean) => Promise<void>;
  fetchRawUsageData: (forceRefresh?: boolean) => Promise<void>;
  fetchCustomerDetails: () => Promise<void>;
  fetchContractDetails: () => Promise<void>;
  updateSubscriptionQuantity: (contractId: string, subscriptionId: string, newQuantity: number) => Promise<void>;
  rechargeBalance: (rechargeAmount: number, thresholdAmount?: number) => Promise<void>;
  updateAutoRecharge: (isEnabled?: boolean, thresholdAmount?: number, rechargeToAmount?: number) => Promise<void>;
  updateThresholdBalance: (isEnabled?: boolean, spendThresholdAmount?: number) => Promise<void>;
  fetchInvoiceEmbeddable: (forceRefresh?: boolean, forceLightMode?: boolean) => Promise<void>;
  fetchCommitsEmbeddable: (forceRefresh?: boolean, forceLightMode?: boolean) => Promise<void>;
  fetchUsageEmbeddable: (forceRefresh?: boolean, forceLightMode?: boolean) => Promise<void>;
  createSpendAlert: (threshold: number) => Promise<void>;
  createBalanceAlert: (threshold: number) => Promise<void>;
  createCommitPercentageAlert: (percentage: number) => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
  fetchBillableMetric: (billableMetricId: string) => Promise<any>;
  sendUsageData: (event_type: string, properties:  Record<string, any>, timestamp: string) => Promise<any>;
  previewEvents: (events: Array<{event_type: string; timestamp?: string; properties?: Record<string, any>}>) => Promise<any>;
}

const MetronomeContext = createContext<MetronomeContextType | undefined>(undefined);

export function MetronomeProvider({ 
  children, 
  customerId,
  contractId,
  apiKey,
  rechargeProductId
}: { 
  children: React.ReactNode;
  customerId: string;
  contractId?: string;
  apiKey?: string;
  rechargeProductId?: string;
}) {
  const [config, setConfig] = useState<MetronomeConfig>({
    customer_id: customerId,
    contract_id: contractId,
    customer_details: undefined,
    contract_details: undefined,
    invoice_draft_details: undefined,
    invoice_breakdown_details: undefined,
  });

  const [balance, setBalance] = useState<Balance | null>(null);
  const [costs, setCosts] = useState<BreakdownData | null>(null);
  const [currentSpend, setCurrentSpend] = useState<CurrentSpend | null>(null);
  const [alerts, setAlerts] = useState<AlertsResult | null>(null);
  const [invoices, setInvoices] = useState<InvoiceListItem[] | null>(null);
  const [rawUsageData, setRawUsageData] = useState<RawUsageData | null>(null);
  
  // Cache flags to track if data has been fetched for current customer/contract
  const [costsCacheKey, setCostsCacheKey] = useState<string>("");
  const [usageCacheKey, setUsageCacheKey] = useState<string>("");
  const [invoicesCacheKey, setInvoicesCacheKey] = useState<string>("");
  const [invoiceEmbeddableCacheKey, setInvoiceEmbeddableCacheKey] = useState<string>("");
  const [commitsEmbeddableCacheKey, setCommitsEmbeddableCacheKey] = useState<string>("");
  const [usageEmbeddableCacheKey, setUsageEmbeddableCacheKey] = useState<string>("");

  // Clear cache when customer or contract changes
  useEffect(() => {
    const currentCacheKey = `${config.customer_id}-${config.contract_id}`;
    
    // If the cache key doesn't match current customer/contract, clear the cache
    if (costsCacheKey && costsCacheKey !== currentCacheKey) {
      setCosts(null);
      setCostsCacheKey("");
    }
    
    if (usageCacheKey && usageCacheKey !== currentCacheKey) {
      setRawUsageData(null);
      setUsageCacheKey("");
    }
    
    if (invoicesCacheKey && invoicesCacheKey !== currentCacheKey) {
      setInvoices(null);
      setInvoicesCacheKey("");
    }
    
    if (invoiceEmbeddableCacheKey && invoiceEmbeddableCacheKey !== currentCacheKey) {
      setInvoiceEmbeddableUrl(null);
      setInvoiceEmbeddableCacheKey("");
    }
    
    if (commitsEmbeddableCacheKey && commitsEmbeddableCacheKey !== currentCacheKey) {
      setCommitsEmbeddableUrl(null);
      setCommitsEmbeddableCacheKey("");
    }
    
    if (usageEmbeddableCacheKey && usageEmbeddableCacheKey !== currentCacheKey) {
      setUsageEmbeddableUrl(null);
      setUsageEmbeddableCacheKey("");
    }
  }, [config.customer_id, config.contract_id, costsCacheKey, usageCacheKey, invoicesCacheKey, invoiceEmbeddableCacheKey, commitsEmbeddableCacheKey, usageEmbeddableCacheKey]);

  // Clear embeddable URLs when theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      // Clear all embeddable URLs when theme changes
      setInvoiceEmbeddableUrl(null);
      setCommitsEmbeddableUrl(null);
      setUsageEmbeddableUrl(null);
      
      // Clear cache keys to force refetch
      setInvoiceEmbeddableCacheKey("");
      setCommitsEmbeddableCacheKey("");
      setUsageEmbeddableCacheKey("");
    };

    // Listen for theme changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        handleThemeChange();
      }
    };

    // Listen for custom theme change events
    const handleCustomThemeChange = () => {
      handleThemeChange();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChanged', handleCustomThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged', handleCustomThemeChange);
    };
  }, []);

  const [invoiceEmbeddableUrl, setInvoiceEmbeddableUrl] = useState<string | null>(null);
  const [commitsEmbeddableUrl, setCommitsEmbeddableUrl] = useState<string | null>(null);
  const [usageEmbeddableUrl, setUsageEmbeddableUrl] = useState<string | null>(null);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    balance: false,
    costs: false,
    currentSpend: false,
    alerts: false,
    invoiceEmbeddable: false,
    commitsEmbeddable: false,
    usageEmbeddable: false,
    invoices: false,
    rawUsageData: false,
    customerDetails: false,
    contractDetails: false,
  });

  const [isCustomerTransitioning, setIsCustomerTransitioning] = useState(false);

  // Update customer_id and contract_id when they change
  useEffect(() => {
    if (customerId && (customerId !== config.customer_id || contractId !== config.contract_id)) {
      // Set transitioning state
      setIsCustomerTransitioning(true);
      
      // Reset all data when customer or contract changes
      setBalance(null);
      setCosts(null);
      setCurrentSpend(null);
      setAlerts(null);
      setInvoices(null);
      setRawUsageData(null);
      setInvoiceEmbeddableUrl(null);
      setCommitsEmbeddableUrl(null);
      setUsageEmbeddableUrl(null);
      
      // Reset all cache keys
      setCostsCacheKey("");
      setUsageCacheKey("");
      setInvoicesCacheKey("");
      setInvoiceEmbeddableCacheKey("");
      setCommitsEmbeddableCacheKey("");
      setUsageEmbeddableCacheKey("");
      
      // Reset all loading states
      setLoadingStates({
        balance: false,
        costs: false,
        currentSpend: false,
        alerts: false,
        invoices: false,
        rawUsageData: false,
        invoiceEmbeddable: false,
        commitsEmbeddable: false,
        usageEmbeddable: false,
        customerDetails: false,
        contractDetails: false,
      });
      
      // Update config with new object to trigger re-renders
      setConfig({
        customer_id: customerId,
        contract_id: contractId,
        customer_details: undefined, // Clear customer details when changing
        contract_details: undefined, // Clear contract details when changing
        invoice_draft_details: undefined, // Clear invoice draft details when changing
        invoice_breakdown_details: undefined, // Clear invoice breakdown details when changing
      });
      
      // Don't clear transitioning state here - let the automatic data loading useEffect handle it
    }
  }, [customerId, contractId, config.customer_id, config.contract_id]);


  const fetchBalance = useCallback(async () => {
    if (!config.customer_id || !config.contract_id) return;
    setLoadingStates(prev => ({ ...prev, balance: true }));
    try {
      const response = await fetchMetronomeCustomerBalance(
        config.customer_id,
        config.contract_id, // Pass contract_id to filter by contract
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setBalance(response.result);
      } else {
        console.error("Failed to fetch balance:", response.message);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, balance: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey]);

  const fetchCosts = useCallback(async (forceRefresh = false) => {
    if (!config.customer_id || !config.contract_id) return;

    // Create cache key for current customer/contract combination
    const currentCacheKey = `${config.customer_id}-${config.contract_id}`;
    
    // If we already have data for this customer/contract and not forcing refresh, don't fetch again
    if (!forceRefresh && costsCacheKey === currentCacheKey && costs) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, costs: true }));
    try {
      const response = await fetchMetronomeInvoiceBreakdown(
        config.customer_id,
        "DAY",
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setCosts(response.result.costs);
        setCostsCacheKey(currentCacheKey); // Update cache key
        // Store raw invoice breakdown details in config
        setConfig(prev => ({
          ...prev,
          invoice_breakdown_details: response.rawData, // Store the raw Metronome payload
        }));
      } else {
        console.error("Failed to fetch costs:", response.message);
        setCostsCacheKey(""); // Clear cache key on error
      }
    } catch (error) {
      console.error("Error fetching costs:", error);
      setCostsCacheKey(""); // Clear cache key on error
    } finally {
      setLoadingStates(prev => ({ ...prev, costs: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey, costsCacheKey, costs]);

  const fetchCurrentSpend = useCallback(async () => {
    if (!config.customer_id || !config.contract_id) return;

    try {
      const response = await fetchCurrentSpendDraftInvoice(
        config.customer_id,
        config.contract_id, // Pass contract_id to filter by contract
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setCurrentSpend(response.result);
        // Store raw invoice draft details in config
        setConfig(prev => ({
          ...prev,
          invoice_draft_details: response.rawData, // Store the raw Metronome payload
        }));
      } else {
        console.error("Failed to fetch current spend:", response.message);
      }
    } catch (error) {
      console.error("Error fetching current spend:", error);
    }
  }, [config.customer_id, config.contract_id, apiKey]);

  const fetchAlerts = useCallback(async () => {
    if (!config.customer_id || !config.contract_id) return;

    setLoadingStates(prev => ({ ...prev, alerts: true }));
    try {
      const response = await fetchCustomerAlerts(
        config.customer_id,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setAlerts(response.result);
      } else {
        console.error("Failed to fetch alerts:", response.message);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, alerts: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey]);

  const fetchInvoices = useCallback(async (forceRefresh = false) => {
    if (!config.customer_id || !config.contract_id) return;

    // Create cache key for current customer/contract combination
    const currentCacheKey = `${config.customer_id}-${config.contract_id}`;
    
    // If we already have data for this customer/contract and not forcing refresh, don't fetch again
    if (!forceRefresh && invoicesCacheKey === currentCacheKey && invoices) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, invoices: true }));
    try {
      const response = await fetchCustomerInvoices(
        config.customer_id,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setInvoices(response.result.invoices);
        setInvoicesCacheKey(currentCacheKey); // Update cache key
      } else {
        console.error("Failed to fetch invoices:", response.message);
        setInvoicesCacheKey(""); // Clear cache key on error
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoicesCacheKey(""); // Clear cache key on error
    } finally {
      setLoadingStates(prev => ({ ...prev, invoices: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey, invoicesCacheKey, invoices]);

  const fetchInvoiceEmbeddable = useCallback(async (forceRefresh = false, forceLightMode = false) => {
    if (!config.customer_id || !config.contract_id) return;

    // Create cache key for current customer/contract combination
    const currentCacheKey = `${config.customer_id}-${config.contract_id}`;
    
    // If we already have data for this customer/contract and not forcing refresh, don't fetch again
    if (!forceRefresh && invoiceEmbeddableCacheKey === currentCacheKey && invoiceEmbeddableUrl) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, invoiceEmbeddable: true }));
    try {
      const theme = forceLightMode ? 'light' : getCurrentTheme();
      const response = await createMetronomeEmbeddableLink(
        config.customer_id,
        "invoices",
        apiKey, // This can be undefined, and backend will use env var
        theme, // Pass theme (forced light or current theme)
      );

      if (response.status === "success") {
        setInvoiceEmbeddableUrl(response.result || null);
        setInvoiceEmbeddableCacheKey(currentCacheKey); // Update cache key
      } else {
        console.error("Failed to fetch invoice embeddable:", response.message);
        setInvoiceEmbeddableCacheKey(""); // Clear cache key on error
      }
    } catch (error) {
      console.error("Error fetching invoice embeddable:", error);
      setInvoiceEmbeddableCacheKey(""); // Clear cache key on error
    } finally {
      setLoadingStates(prev => ({ ...prev, invoiceEmbeddable: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey, invoiceEmbeddableCacheKey, invoiceEmbeddableUrl]);

  const fetchCommitsEmbeddable = useCallback(async (forceRefresh = false, forceLightMode = false) => {
    if (!config.customer_id || !config.contract_id) return;

    // Create cache key for current customer/contract combination
    const currentCacheKey = `${config.customer_id}-${config.contract_id}`;
    
    // If we already have data for this customer/contract and not forcing refresh, don't fetch again
    if (!forceRefresh && commitsEmbeddableCacheKey === currentCacheKey && commitsEmbeddableUrl) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, commitsEmbeddable: true }));
    try {
      const theme = forceLightMode ? 'light' : getCurrentTheme();
      console.log("Theme for commits embeddable:", theme);
      
      const response = await createMetronomeEmbeddableLink(
        config.customer_id,
        "commits_and_credits",
        apiKey, // This can be undefined, and backend will use env var
        theme, // Pass theme (forced light or current theme)
      );

      if (response.status === "success") {
        setCommitsEmbeddableUrl(response.result || null);
        setCommitsEmbeddableCacheKey(currentCacheKey); // Update cache key
      } else {
        console.error("Failed to fetch commits embeddable:", response.message);
        setCommitsEmbeddableCacheKey(""); // Clear cache key on error
      }
    } catch (error) {
      console.error("Error fetching commits embeddable:", error);
      setCommitsEmbeddableCacheKey(""); // Clear cache key on error
    } finally {
      setLoadingStates(prev => ({ ...prev, commitsEmbeddable: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey, commitsEmbeddableCacheKey, commitsEmbeddableUrl]);

  const fetchUsageEmbeddable = useCallback(async (forceRefresh = false, forceLightMode = false) => {
    console.log("fetchUsageEmbeddable called with customer_id:", config.customer_id, "contract_id:", config.contract_id);
    if (!config.customer_id || !config.contract_id) {
      console.log("No customer_id or contract_id, returning early");
      return;
    }

    // Create cache key for current customer/contract combination
    const currentCacheKey = `${config.customer_id}-${config.contract_id}`;
    
    // If we already have data for this customer/contract and not forcing refresh, don't fetch again
    if (!forceRefresh && usageEmbeddableCacheKey === currentCacheKey && usageEmbeddableUrl) {
      console.log("Usage embeddable already cached, skipping fetch");
      return;
    }

    setLoadingStates(prev => ({ ...prev, usageEmbeddable: true }));
    try {
      console.log("Calling createMetronomeEmbeddableLink...");
      const theme = forceLightMode ? 'light' : getCurrentTheme();
      const response = await createMetronomeEmbeddableLink(
        config.customer_id,
        "usage",
        apiKey, // This can be undefined, and backend will use env var
        theme, // Pass theme (forced light or current theme)
      );

      console.log("createMetronomeEmbeddableLink response:", response);

      if (response.status === "success") {
        console.log("Setting usageEmbeddableUrl to:", response.result);
        setUsageEmbeddableUrl(response.result || null);
        setUsageEmbeddableCacheKey(currentCacheKey); // Update cache key
      } else {
        console.error("Failed to fetch usage embeddable:", response.message);
        setUsageEmbeddableCacheKey(""); // Clear cache key on error
      }
    } catch (error) {
      console.error("Error fetching usage embeddable:", error);
      setUsageEmbeddableCacheKey(""); // Clear cache key on error
    } finally {
      setLoadingStates(prev => ({ ...prev, usageEmbeddable: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey, usageEmbeddableCacheKey, usageEmbeddableUrl]);

  const fetchRawUsageData = useCallback(async (forceRefresh = false) => {
    if (!config.customer_id || !config.contract_id) return;

    // Create cache key for current customer/contract combination
    const currentCacheKey = `${config.customer_id}-${config.contract_id}`;
    
    // If we already have data for this customer/contract and not forcing refresh, don't fetch again
    if (!forceRefresh && usageCacheKey === currentCacheKey && rawUsageData) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, rawUsageData: true }));
    try {
      const response = await fetchRawUsageDataAction(
        config.customer_id,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setRawUsageData(response.result || null);
        setUsageCacheKey(currentCacheKey); // Update cache key
      } else {
        console.error("Failed to fetch raw usage data:", response.message);
        setUsageCacheKey(""); // Clear cache key on error
      }
    } catch (error) {
      console.error("Error fetching raw usage data:", error);
      setUsageCacheKey(""); // Clear cache key on error
    } finally {
      setLoadingStates(prev => ({ ...prev, rawUsageData: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey, usageCacheKey, rawUsageData]);

  const fetchCustomerDetails = useCallback(async () => {
    if (!config.customer_id) return;

    setLoadingStates(prev => ({ ...prev, customerDetails: true }));
    try {
      const response = await fetchCustomerDetailsAction(
        config.customer_id,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Update config with customer details
        setConfig(prev => ({
          ...prev,
          customer_details: response.result,
        }));
      } else {
        console.error("Failed to fetch customer details:", response.message);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, customerDetails: false }));
    }
  }, [config.customer_id, apiKey]);

  const fetchContractDetails = useCallback(async () => {
    if (!config.customer_id || !config.contract_id) return;

    setLoadingStates(prev => ({ ...prev, contractDetails: true }));
    try {
      const response = await retrieveContractDetailsAction(
        config.customer_id,
        config.contract_id,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Update config with contract details
        setConfig(prev => ({
          ...prev,
          contract_details: response.result,
        }));
      } else {
        console.error("Failed to fetch contract details:", response.message);
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, contractDetails: false }));
    }
  }, [config.customer_id, config.contract_id, apiKey]);


  // Automatically load essential data when customer and contract are first available
  useEffect(() => {
    // Only load data if the config matches the current props
    if (config.customer_id === customerId && config.contract_id === contractId) {
      // Clear transitioning state when we start loading new data
      setIsCustomerTransitioning(false);
      
      // Load essential data automatically
      fetchBalance();
      fetchCurrentSpend();
      fetchAlerts();
      fetchCustomerDetails();
      fetchContractDetails();
    }
  }, [config.customer_id, config.contract_id, customerId, contractId, fetchBalance, fetchCurrentSpend, fetchAlerts, fetchCustomerDetails, fetchContractDetails]);


  const updateSubscriptionQuantity = useCallback(async (contractId: string, subscriptionId: string, newQuantity: number) => {
    if (!config.customer_id) return;

    try {
      const response = await updateSubscriptionQuantityAction(
        config.customer_id,
        contractId,
        subscriptionId,
        newQuantity,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh contract details after successful update
        await fetchContractDetails();
      } else {
        console.error("Failed to update subscription quantity:", response.message);
        throw new Error(response.message || "Failed to update subscription quantity");
      }
    } catch (error) {
      console.error("Error updating subscription quantity:", error);
      throw error;
    }
  }, [config.customer_id, apiKey, fetchContractDetails]);

  const rechargeBalance = useCallback(async (rechargeAmount: number, thresholdAmount?: number) => {
    try {
      // Check if balance data is available
      if (!balance) {
        throw new Error("Balance information is not available. Please refresh the page and try again.");
      }

      // Check if currency_id is available in balance
      if (!balance.currency_id) {
        throw new Error("Currency information is not available in your balance data. Please ensure your account has proper currency configuration.");
      }

      // Check if recharge product ID is configured
      if (!rechargeProductId) {
        throw new Error("Recharge Product ID is not configured. Please set up a recharge product ID in your settings to enable balance recharging.");
      }

      const response = await rechargeBalanceAction(
        config.customer_id,
        rechargeAmount,
        balance.currency_id,
        rechargeProductId, // Pass the recharge product ID from settings
        config.contract_details, // Pass contract details to avoid listing contracts
        thresholdAmount, // Pass threshold for auto recharge
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh balance data after successful recharge
        await fetchBalance();
        // Also refresh contract details if auto recharge was configured
        if (thresholdAmount) {
          await fetchContractDetails();
        }
      } else {
        console.error("Failed to recharge balance:", response.message);
        throw new Error(response.message || "Failed to recharge balance");
      }
    } catch (error) {
      console.error("Error recharging balance:", error);
      throw error; // Re-throw so the modal can handle it
    }
  }, [config.customer_id, config.contract_details, apiKey, rechargeProductId, balance, fetchBalance, fetchContractDetails]);

  const updateAutoRecharge = useCallback(async (isEnabled?: boolean, thresholdAmount?: number, rechargeToAmount?: number) => {
    try {
      if (!config.customer_id || !config.contract_id) {
        throw new Error("Customer ID and Contract ID are required to update auto recharge");
      }

      const response = await updateAutoRechargeAction(
        config.customer_id,
        config.contract_id,
        isEnabled,
        thresholdAmount,
        rechargeToAmount,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh contract details to get updated auto recharge configuration
        await fetchContractDetails();
        // Also refresh balance to reflect any changes
        await fetchBalance();
      } else {
        console.error("Failed to update auto recharge:", response.message);
        throw new Error(response.message || "Failed to update auto recharge");
      }
    } catch (error) {
      console.error("Error updating auto recharge:", error);
      throw error; // Re-throw so the modal can handle it
    }
  }, [config.customer_id, config.contract_id, apiKey, fetchContractDetails, fetchBalance]);

  const updateThresholdBalance = useCallback(async (isEnabled?: boolean, spendThresholdAmount?: number) => {
    try {
      if (!config.customer_id || !config.contract_id) {
        throw new Error("Customer ID and Contract ID are required to update spend threshold");
      }

      const response = await updateThresholdBalanceAction(
        config.customer_id,
        config.contract_id,
        isEnabled,
        spendThresholdAmount,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh contract details to get updated spend threshold configuration
        await fetchContractDetails();
        // Also refresh current spend to reflect any changes
        await fetchCurrentSpend();
      } else {
        console.error("Failed to update spend threshold:", response.message);
        throw new Error(response.message || "Failed to update spend threshold");
      }
    } catch (error) {
      console.error("Error updating spend threshold:", error);
      throw error; // Re-throw so the modal can handle it
    }
  }, [config.customer_id, config.contract_id, apiKey, fetchContractDetails, fetchCurrentSpend]);

  const createSpendAlert = useCallback(async (threshold: number) => {
    if (!config.customer_id) return;

    try {
      const response = await createCustomerSpendAlert(
        config.customer_id,
        threshold,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh alerts after creating a new one
        await fetchAlerts();
      } else {
        console.error("Failed to create spend alert:", response.message);
      }
    } catch (error) {
      console.error("Error creating spend alert:", error);
    }
  }, [config.customer_id, apiKey, fetchAlerts]);

  const createBalanceAlert = useCallback(async (threshold: number) => {
    if (!config.customer_id) return;

    try {
      const response = await createCustomerBalanceAlert(
        config.customer_id,
        threshold,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh alerts after creating a new one
        await fetchAlerts();
      } else {
        console.error("Failed to create balance alert:", response.message);
      }
    } catch (error) {
      console.error("Error creating balance alert:", error);
    }
  }, [config.customer_id, apiKey, fetchAlerts]);

  const createCommitPercentageAlert = useCallback(async (percentage: number) => {
    if (!config.customer_id) return;

    try {
      const response = await createCustomerCommitPercentageAlert(
        config.customer_id,
        100-percentage,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh alerts after creating a new one
        await fetchAlerts();
      } else {
        console.error("Failed to create commit percentage alert:", response.message);
      }
    } catch (error) {
      console.error("Error creating commit percentage alert:", error);
    }
  }, [config.customer_id, apiKey, fetchAlerts]);

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      
      const response = await deleteCustomerAlert(
        alertId,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh alerts after deleting
        await fetchAlerts();
      } else {
        console.error("Failed to delete alert:", response.message);
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  }, [apiKey, fetchAlerts]);

  const fetchBillableMetric = useCallback(async (billableMetricId: string) => {
    try {
      const response = await fetchBillableMetricAction(
        billableMetricId,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        return response.result;
      } else {
        throw new Error(response.message || "Failed to fetch billable metric");
      }
    } catch (error) {
      console.error("Error fetching billable metric:", error);
      throw error;
    }
  }, [apiKey]);

  const sendUsageData = useCallback(async (event_type: string, properties: Record<string, any>, timestamp: string ) => {
    if (!config.customer_id) {
      throw new Error("Customer ID is not available. Please refresh the page and try again.");
    }

    try {
      const response = await sendUsageDataAction(
        config.customer_id,
        event_type,
        properties,
        timestamp,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        return response.result;
      } else {
        throw new Error(response.message || "Failed to send usage data");
      }
    } catch (error) {
      console.error("Error sending usage data:", error);
      throw error;
    }
  }, [config.customer_id, apiKey]);

  const previewEvents = useCallback(async (events: Array<{event_type: string; timestamp?: string; properties?: Record<string, any>}>) => {
    if (!config.customer_id) {
      throw new Error("Customer ID is not available. Please refresh the page and try again.");
    }

    try {
      const response = await previewEventsAction(
        config.customer_id,
        events,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        return response.result;
      } else {
        throw new Error(response.message || "Failed to preview events");
      }
    } catch (error) {
      console.error("Error previewing events:", error);
      throw error;
    }
  }, [config.customer_id, apiKey]);



  const value: MetronomeContextType = {
    config,
    balance,
    costs,
    currentSpend,
    alerts,
    invoices,
    rawUsageData,
    invoiceEmbeddableUrl,
    commitsEmbeddableUrl,
    usageEmbeddableUrl,
    loadingStates,
    isCustomerTransitioning,
    rechargeProductId,
    fetchBalance,
    fetchCosts,
    fetchCurrentSpend,
    fetchAlerts,
    fetchInvoices,
    fetchRawUsageData,
    fetchCustomerDetails,
    fetchContractDetails,
    updateSubscriptionQuantity,
    rechargeBalance,
    updateAutoRecharge,
    updateThresholdBalance,
    fetchInvoiceEmbeddable,
    fetchCommitsEmbeddable,
    fetchUsageEmbeddable,
    createSpendAlert,
    createBalanceAlert,
    createCommitPercentageAlert,
    deleteAlert,
    fetchBillableMetric,
    sendUsageData,
    previewEvents,
  };

  return (
    <MetronomeContext.Provider value={value}>
      {children}
    </MetronomeContext.Provider>
  );
}

export function useMetronome() {
  const context = useContext(MetronomeContext);
  if (context === undefined) {
    throw new Error("useMetronome must be used within a MetronomeProvider");
  }
  return context;
}
