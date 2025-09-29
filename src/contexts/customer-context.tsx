"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMetronomeCustomers, listContracts } from '@/actions/metronome';

interface Customer {
  id: string;
  name: string;
  metronome_customer_id: string;
  description?: string;
}

interface Contract {
  id: string;
  name?: string;
  customer_id: string;
  starting_at?: string;
  ending_before?: string;
}

interface CustomerContextType {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
  customers: Customer[];
  loading: boolean;
  refreshCustomers: () => Promise<void>;
  contracts: Contract[];
  selectedContract: Contract | null;
  setSelectedContract: (contract: Contract) => void;
  loadingContracts: boolean;
  fetchContracts: (customerId: string, isInitialLoad?: boolean) => Promise<void>;
  onContractSelected?: (contract: Contract) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ 
  children, 
  onContractSelected 
}: { 
  children: React.ReactNode;
  onContractSelected?: (contract: Contract) => void;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      // Clear selected customer immediately when loading new customers
      setSelectedCustomer(null);
      setContracts([]);
      setSelectedContract(null);
      
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
        
        // Set default customer (first one from Metronome) and fetch contracts
        if (metronomeCustomers.length > 0) {
          const firstCustomer = metronomeCustomers[0];
          setSelectedCustomer(firstCustomer);
          // Automatically fetch contracts for the first customer
          await fetchContracts(firstCustomer.metronome_customer_id, true);
        } else {
          setSelectedCustomer(null);
          setLoading(false);
        }
      } else {
        console.error('Failed to load customers from Metronome:', response.message);
        setCustomers([]);
        setSelectedCustomer(null);
        setLoading(false);
        
        // Show user-friendly error message for API key issues
        if (response.message?.includes('Invalid API key')) {
          // You could dispatch a toast notification here or set an error state
          console.warn('API key validation failed - user should check their settings');
        }
      }
    } catch (error) {
      console.error('Error loading customers from Metronome:', error);
      setCustomers([]);
      setSelectedCustomer(null);
      setLoading(false);
    } finally {
      // Keep loading state active until contracts are also loaded
      // The loading state will be set to false in fetchContracts
    }
  }, []);

  const fetchContracts = useCallback(async (customerId: string, isInitialLoad = false) => {
    try {
      setLoadingContracts(true);
      setContracts([]);
      setSelectedContract(null);
      
      // Get API key from localStorage (can be null/undefined)
      const apiKey = localStorage.getItem("metronome_api_key");
      
      const response = await listContracts(customerId, apiKey || undefined);
      
      if (response.status === "success") {
        // Transform Metronome contract data to our Contract interface
        const metronomeContracts: Contract[] = response.result.map((contract: any) => ({
          id: contract.id,
          name: contract.name,
          customer_id: contract.customer_id,
          starting_at: contract.starting_at,
          ending_before: contract.ending_before,
        }));
        
        setContracts(metronomeContracts);
        
        // Set default contract (first one from Metronome)
        if (metronomeContracts.length > 0) {
          setSelectedContract(metronomeContracts[0]);
        } else {
          setSelectedContract(null);
        }
      } else {
        console.error('Failed to load contracts from Metronome:', response.message);
        setContracts([]);
        setSelectedContract(null);
        
        // Show user-friendly error message for API key issues
        if (response.message?.includes('Invalid API key')) {
          console.warn('API key validation failed while fetching contracts - user should check their settings');
        }
      }
    } catch (error) {
      console.error('Error loading contracts from Metronome:', error);
      setContracts([]);
      setSelectedContract(null);
    } finally {
      setLoadingContracts(false);
      // Also set main loading to false when contracts are loaded (for initial load sequence)
      if (isInitialLoad) {
        setLoading(false);
      }
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
    // Clear contracts and selected contract first
    setContracts([]);
    setSelectedContract(null);
    // Fetch contracts for the selected customer
    fetchContracts(customer.metronome_customer_id);
    // No localStorage - only use dropdown selection
  };

  const handleSetSelectedContract = (contract: Contract) => {
    setSelectedContract(contract);
    // Call the callback to notify parent components
    if (onContractSelected) {
      onContractSelected(contract);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        selectedCustomer,
        setSelectedCustomer: handleSetSelectedCustomer,
        customers,
        loading,
        refreshCustomers: loadCustomers,
        contracts,
        selectedContract,
        setSelectedContract: handleSetSelectedContract,
        loadingContracts,
        fetchContracts,
        onContractSelected
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
