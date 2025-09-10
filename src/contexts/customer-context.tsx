"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMetronomeCustomers } from '@/actions/metronome';

interface Customer {
  id: string;
  name: string;
  metronome_customer_id: string;
  description?: string;
}

interface CustomerContextType {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
  customers: Customer[];
  loading: boolean;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      // Get API key from localStorage (can be null/undefined)
      const apiKey = localStorage.getItem("metronome_api_key");
      
      const response = await fetchMetronomeCustomers(apiKey || undefined);
      
      if (response.status === "success") {
        // Transform Metronome customer data to our Customer interface
        const metronomeCustomers: Customer[] = response.result.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          metronome_customer_id: customer.id,
          // description: customer.description || `Customer: ${customer.id}`
        }));
        
        setCustomers(metronomeCustomers);
        
        // Set default customer (first one from Metronome)
        if (metronomeCustomers.length > 0) {
          setSelectedCustomer(metronomeCustomers[0]);
        } else {
          setSelectedCustomer(null);
        }
      } else {
        console.error('Failed to load customers from Metronome:', response.message);
        setCustomers([]);
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('Error loading customers from Metronome:', error);
      setCustomers([]);
      setSelectedCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for storage changes (API key updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "metronome_api_key") {
        // API key changed, refresh customers
        loadCustomers();
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (same tab changes)
    const handleApiKeyChange = () => {
      loadCustomers();
    };

    window.addEventListener('apiKeyChanged', handleApiKeyChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apiKeyChanged', handleApiKeyChange);
    };
  }, [loadCustomers]);

  // Initial load
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSetSelectedCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    // No localStorage - only use dropdown selection
  };

  return (
    <CustomerContext.Provider
      value={{
        selectedCustomer,
        setSelectedCustomer: handleSetSelectedCustomer,
        customers,
        loading,
        refreshCustomers: loadCustomers
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
