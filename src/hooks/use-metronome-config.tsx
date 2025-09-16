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
  deleteCustomerAlert,
  createMetronomeEmbeddableLink,
  fetchCurrentSpendDraftInvoice,
  fetchCustomerAlerts,
  fetchCustomerInvoices,
  fetchMetronomeCustomerBalance,
  fetchMetronomeInvoiceBreakdown,
  fetchRawUsageData as fetchRawUsageDataAction,
  rechargeBalance as rechargeBalanceAction,
  fetchBillableMetric as fetchBillableMetricAction,
  sendUsageData as sendUsageDataAction,
} from "@/actions/metronome";

// Types based on the backend API
interface MetronomeConfig {
  customer_id: string;
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
  productTotals: Record<string, { total: number; currency_name: string }>;
}

interface InvoiceListItem {
  start_timestamp: string;
  end_timestamp: string;
  total: number;
  status: string;
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
  alerts: boolean;
  invoiceEmbeddable: boolean;
  commitsEmbeddable: boolean;
  usageEmbeddable: boolean;
  invoices: boolean;
  rawUsageData: boolean;
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
  rechargeProductId?: string;
  fetchBalance: () => Promise<void>;
  fetchCosts: () => Promise<void>;
  fetchCurrentSpend: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchRawUsageData: () => Promise<void>;
  rechargeBalance: (rechargeAmount: number) => Promise<void>;
  fetchInvoiceEmbeddable: () => Promise<void>;
  fetchCommitsEmbeddable: () => Promise<void>;
  fetchUsageEmbeddable: () => Promise<void>;
  createSpendAlert: (threshold: number) => Promise<void>;
  createBalanceAlert: (threshold: number) => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
  fetchBillableMetric: (billableMetricId: string) => Promise<any>;
  sendUsageData: (event_type: string, properties:  Record<string, any>) => Promise<any>;
}

const MetronomeContext = createContext<MetronomeContextType | undefined>(undefined);

export function MetronomeProvider({ 
  children, 
  customerId,
  apiKey,
  rechargeProductId
}: { 
  children: React.ReactNode;
  customerId: string;
  apiKey?: string;
  rechargeProductId?: string;
}) {
  const [config, setConfig] = useState<MetronomeConfig>({
    customer_id: customerId,
  });

  const [balance, setBalance] = useState<Balance | null>(null);
  const [costs, setCosts] = useState<BreakdownData | null>(null);
  const [currentSpend, setCurrentSpend] = useState<CurrentSpend | null>(null);
  const [alerts, setAlerts] = useState<AlertsResult | null>(null);
  const [invoices, setInvoices] = useState<InvoiceListItem[] | null>(null);
  const [rawUsageData, setRawUsageData] = useState<RawUsageData | null>(null);
  const [invoiceEmbeddableUrl, setInvoiceEmbeddableUrl] = useState<string | null>(null);
  const [commitsEmbeddableUrl, setCommitsEmbeddableUrl] = useState<string | null>(null);
  const [usageEmbeddableUrl, setUsageEmbeddableUrl] = useState<string | null>(null);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    balance: false,
    costs: false,
    alerts: false,
    invoiceEmbeddable: false,
    commitsEmbeddable: false,
    usageEmbeddable: false,
    invoices: false,
    rawUsageData: false,
  });

  // Update customer_id when it changes
  useEffect(() => {
    if (customerId && customerId !== config.customer_id) {
      // Reset all data when customer changes
      setBalance(null);
      setCosts(null);
      setCurrentSpend(null);
      setAlerts(null);
      setInvoices(null);
      setRawUsageData(null);
      setInvoiceEmbeddableUrl(null);
      setCommitsEmbeddableUrl(null);
      setUsageEmbeddableUrl(null);
      
      // Update config with new object to trigger re-renders
      setConfig({
        customer_id: customerId,
      });
    }
  }, [customerId, config.customer_id]);

  const fetchBalance = useCallback(async () => {
    if (!config.customer_id) return;
    setLoadingStates(prev => ({ ...prev, balance: true }));
    try {
      const response = await fetchMetronomeCustomerBalance(
        config.customer_id,
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
  }, [config.customer_id, apiKey]);

  const fetchCosts = useCallback(async () => {
    if (!config.customer_id) return;

    setLoadingStates(prev => ({ ...prev, costs: true }));
    try {
      const response = await fetchMetronomeInvoiceBreakdown(
        config.customer_id,
        "DAY",
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setCosts(response.result.costs);
      } else {
        console.error("Failed to fetch costs:", response.message);
      }
    } catch (error) {
      console.error("Error fetching costs:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, costs: false }));
    }
  }, [config.customer_id, apiKey]);

  const fetchCurrentSpend = useCallback(async () => {
    if (!config.customer_id) return;

    try {
      const response = await fetchCurrentSpendDraftInvoice(
        config.customer_id,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setCurrentSpend(response.result);
      } else {
        console.error("Failed to fetch current spend:", response.message);
      }
    } catch (error) {
      console.error("Error fetching current spend:", error);
    }
  }, [config.customer_id, apiKey]);

  const fetchAlerts = useCallback(async () => {
    if (!config.customer_id) return;

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
  }, [config.customer_id, apiKey]);

  const fetchInvoices = useCallback(async () => {
    if (!config.customer_id) return;

    setLoadingStates(prev => ({ ...prev, invoices: true }));
    try {
      const response = await fetchCustomerInvoices(
        config.customer_id,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setInvoices(response.result.invoices);
      } else {
        console.error("Failed to fetch invoices:", response.message);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, invoices: false }));
    }
  }, [config.customer_id, apiKey]);

  const fetchInvoiceEmbeddable = useCallback(async () => {
    if (!config.customer_id) return;

    setLoadingStates(prev => ({ ...prev, invoiceEmbeddable: true }));
    try {
      const response = await createMetronomeEmbeddableLink(
        config.customer_id,
        "invoices",
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setInvoiceEmbeddableUrl(response.result || null);
      } else {
        console.error("Failed to fetch invoice embeddable:", response.message);
      }
    } catch (error) {
      console.error("Error fetching invoice embeddable:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, invoiceEmbeddable: false }));
    }
  }, [config.customer_id, apiKey]);

  const fetchCommitsEmbeddable = useCallback(async () => {
    if (!config.customer_id) return;

    setLoadingStates(prev => ({ ...prev, commitsEmbeddable: true }));
    try {
      const response = await createMetronomeEmbeddableLink(
        config.customer_id,
        "commits_and_credits",
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setCommitsEmbeddableUrl(response.result || null);
      } else {
        console.error("Failed to fetch commits embeddable:", response.message);
      }
    } catch (error) {
      console.error("Error fetching commits embeddable:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, commitsEmbeddable: false }));
    }
  }, [config.customer_id, apiKey]);

  const fetchUsageEmbeddable = useCallback(async () => {
    console.log("fetchUsageEmbeddable called with customer_id:", config.customer_id);
    if (!config.customer_id) {
      console.log("No customer_id, returning early");
      return;
    }

    setLoadingStates(prev => ({ ...prev, usageEmbeddable: true }));
    try {
      console.log("Calling createMetronomeEmbeddableLink...");
      const response = await createMetronomeEmbeddableLink(
        config.customer_id,
        "usage",
        apiKey, // This can be undefined, and backend will use env var
      );

      console.log("createMetronomeEmbeddableLink response:", response);

      if (response.status === "success") {
        console.log("Setting usageEmbeddableUrl to:", response.result);
        setUsageEmbeddableUrl(response.result || null);
      } else {
        console.error("Failed to fetch usage embeddable:", response.message);
      }
    } catch (error) {
      console.error("Error fetching usage embeddable:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, usageEmbeddable: false }));
    }
  }, [config.customer_id, apiKey]);

  const fetchRawUsageData = useCallback(async () => {
    if (!config.customer_id) return;

    setLoadingStates(prev => ({ ...prev, rawUsageData: true }));
    try {
      const response = await fetchRawUsageDataAction(
        config.customer_id,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setRawUsageData(response.result || null);
      } else {
        console.error("Failed to fetch raw usage data:", response.message);
      }
    } catch (error) {
      console.error("Error fetching raw usage data:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, rawUsageData: false }));
    }
  }, [config.customer_id, apiKey]);

  const rechargeBalance = useCallback(async (rechargeAmount: number) => {
  

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
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh balance data after successful recharge
        await fetchBalance();
      } else {
        console.error("Failed to recharge balance:", response.message);
        throw new Error(response.message || "Failed to recharge balance");
      }
    } catch (error) {
      console.error("Error recharging balance:", error);
      throw error; // Re-throw so the modal can handle it
    }
  }, [config.customer_id, apiKey, rechargeProductId, balance, fetchBalance]);

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

  const sendUsageData = useCallback(async (event_type: string, properties: Record<string, any> ) => {
    if (!config.customer_id) {
      throw new Error("Customer ID is not available. Please refresh the page and try again.");
    }

    try {
      const response = await sendUsageDataAction(
        config.customer_id,
        event_type,
        properties,
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
    rechargeProductId,
    fetchBalance,
    fetchCosts,
    fetchCurrentSpend,
    fetchAlerts,
    fetchInvoices,
    fetchRawUsageData,
    rechargeBalance,
    fetchInvoiceEmbeddable,
    fetchCommitsEmbeddable,
    fetchUsageEmbeddable,
    createSpendAlert,
    createBalanceAlert,
    deleteAlert,
    fetchBillableMetric,
    sendUsageData,
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
