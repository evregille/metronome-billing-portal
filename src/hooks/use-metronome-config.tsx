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
  createMetronomeEmbeddableLink,
  fetchCurrentSpendDraftInvoice,
  fetchCustomerSpendAlerts,
  fetchMetronomeCustomerBalance,
  fetchMetronomeInvoiceBreakdown,
} from "@/actions/metronome";

// Types based on the backend API
interface MetronomeConfig {
  customer_id: string;
  chart_type: "BarChart" | "LineChart" | "PieChart";
}

interface Balance {
  total_granted: number;
  total_used: number;
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
  total: number;
  productTotals: Record<string, number>;
}

interface LoadingStates {
  balance: boolean;
  costs: boolean;
  usage: boolean;
  alerts: boolean;
  invoiceEmbeddable: boolean;
  commitsEmbeddable: boolean;
}

interface MetronomeContextType {
  config: MetronomeConfig;
  balance: Balance | null;
  costs: BreakdownData | null;
  usage: BreakdownData | null;
  currentSpend: CurrentSpend | null;
  alerts: any[];
  invoiceEmbeddableUrl: string | null;
  commitsEmbeddableUrl: string | null;
  loadingStates: LoadingStates;
  fetchBalance: () => Promise<void>;
  fetchCosts: () => Promise<void>;
  fetchUsage: () => Promise<void>;
  fetchCurrentSpend: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchInvoiceEmbeddable: () => Promise<void>;
  fetchCommitsEmbeddable: () => Promise<void>;
  createAlert: (alertData: any) => Promise<void>;
}

const MetronomeContext = createContext<MetronomeContextType | undefined>(undefined);

export function MetronomeProvider({ 
  children, 
  customerId,
  apiKey 
}: { 
  children: React.ReactNode;
  customerId: string;
  apiKey?: string;
}) {
  const [config, setConfig] = useState<MetronomeConfig>({
    customer_id: customerId,
    chart_type: "BarChart",
  });

  const [balance, setBalance] = useState<Balance | null>(null);
  const [costs, setCosts] = useState<BreakdownData | null>(null);
  const [usage, setUsage] = useState<BreakdownData | null>(null);
  const [currentSpend, setCurrentSpend] = useState<CurrentSpend | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [invoiceEmbeddableUrl, setInvoiceEmbeddableUrl] = useState<string | null>(null);
  const [commitsEmbeddableUrl, setCommitsEmbeddableUrl] = useState<string | null>(null);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    balance: false,
    costs: false,
    usage: false,
    alerts: false,
    invoiceEmbeddable: false,
    commitsEmbeddable: false,
  });

  // Update customer_id when it changes
  useEffect(() => {
    if (customerId && customerId !== config.customer_id) {
      // Reset all data when customer changes
      setBalance(null);
      setCosts(null);
      setUsage(null);
      setCurrentSpend(null);
      setAlerts([]);
      setInvoiceEmbeddableUrl(null);
      setCommitsEmbeddableUrl(null);
      
      // Update config with new object to trigger re-renders
      setConfig({
        customer_id: customerId,
        chart_type: config.chart_type,
      });
    }
  }, [customerId, config.customer_id, config.chart_type]);

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

  const fetchUsage = useCallback(async () => {
    if (!config.customer_id) return;

    setLoadingStates(prev => ({ ...prev, usage: true }));
    try {
      const response = await fetchMetronomeInvoiceBreakdown(
        config.customer_id,
        "DAY",
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        setUsage(response.result.usage);
      } else {
        console.error("Failed to fetch usage:", response.message);
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, usage: false }));
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
      const response = await fetchCustomerSpendAlerts(
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

  const createAlert = useCallback(async (alertData: any) => {
    if (!config.customer_id) return;

    try {
      const response = await createCustomerSpendAlert(
        config.customer_id,
        alertData,
        apiKey, // This can be undefined, and backend will use env var
      );

      if (response.status === "success") {
        // Refresh alerts after creating a new one
        await fetchAlerts();
      } else {
        console.error("Failed to create alert:", response.message);
      }
    } catch (error) {
      console.error("Error creating alert:", error);
    }
  }, [config.customer_id, apiKey, fetchAlerts]);

  const value: MetronomeContextType = {
    config,
    balance,
    costs,
    usage,
    currentSpend,
    alerts,
    invoiceEmbeddableUrl,
    commitsEmbeddableUrl,
    loadingStates,
    fetchBalance,
    fetchCosts,
    fetchUsage,
    fetchCurrentSpend,
    fetchAlerts,
    fetchInvoiceEmbeddable,
    fetchCommitsEmbeddable,
    createAlert,
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
