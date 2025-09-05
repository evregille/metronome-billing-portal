"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Customer {
  id: string;
  name: string;
  metronome_customer_id: string;
  description: string;
}

interface CustomerConfig {
  customers: Customer[];
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
    // Load customer configurations
    const loadCustomers = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) {
          throw new Error('Failed to load customer config');
        }
        const config: CustomerConfig = await response.json();
        setCustomers(config.customers);
        
        // Set default customer (first one from config only)
        if (config.customers.length > 0) {
          setSelectedCustomer(config.customers[0]);
        }
      } catch (error) {
        console.error('Error loading customer config:', error);
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
