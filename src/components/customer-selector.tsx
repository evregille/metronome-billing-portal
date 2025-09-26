"use client";

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCustomer } from '@/contexts/customer-context';
import { ChevronDown, Users, Check } from 'lucide-react';

export function CustomerSelector() {
  const { selectedCustomer, setSelectedCustomer, customers, loading } = useCustomer();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right - window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  const dropdownContent = isOpen && mounted ? (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Dropdown */}
      <div 
        className="fixed w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-xl shadow-xl z-[9999] overflow-hidden"
        style={{
          top: `${dropdownPosition.top}px`,
          right: `${dropdownPosition.right}px`,
        }}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Select Customer</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Choose a customer to view their billing data</p>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => {
                setSelectedCustomer(customer);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                selectedCustomer?.id === customer.id ? 'bg-blue-50 dark:bg-gray-700' : ''
              }`}
            >
              <div className="flex-1 text-left">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{customer.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{customer.description}</p>
                  </div>
                </div>
              </div>
              
              {selectedCustomer?.id === customer.id && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 min-w-[200px]"
      >
        <Users className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {selectedCustomer?.name || 'Select Customer'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Render dropdown using portal to escape stacking context */}
      {mounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}
