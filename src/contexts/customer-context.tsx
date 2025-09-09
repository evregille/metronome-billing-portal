"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load customers from Metronome API
    const loadCustomers = async () => {
      try {
        // Get API key from localStorage (can be null/undefined)
        const apiKey = localStorage.getItem("metronome_api_key");
        
        const response = await fetchMetronomeCustomers(apiKey || undefined);
        
        if (response.status === "success") {
          // Transform Metronome customer data to our Customer interface
          const metronomeCustomers: Customer[] = response.result.map((customer: any) => ({
            id: customer.id,
            name: customer.name,
            metronome_customer_id: customer.id,
            description: customer.description || `Customer: ${customer.name}`
          }));
          
          setCustomers(metronomeCustomers);
          
          // Set default customer (first one from Metronome)
          if (metronomeCustomers.length > 0) {
            setSelectedCustomer(metronomeCustomers[0]);
          }
        } else {
          console.error('Failed to load customers from Metronome:', response.message);
        }
      } catch (error) {
        console.error('Error loading customers from Metronome:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

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
        loading
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
