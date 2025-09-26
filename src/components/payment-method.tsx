"use client";

import { CreditCard, Shield, Check, Plus, AlertCircle } from "lucide-react";

export function PaymentMethod() {
  // Check if there's a payment method available
  // For now, we'll simulate this - in a real app, this would come from the contract details or a separate API call
  const hasPaymentMethod = false; // This would be determined by actual payment method data
  
  return (
    <div className="glass-card card-hover rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Method</h3>
          </div>
        </div>
      </div>

      {hasPaymentMethod ? (
        <div className="space-y-4">
          {/* Credit Card Display */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 text-white relative overflow-hidden">
            {/* Card Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Visa</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/70">Expires</div>
                  <div className="text-sm font-medium">12/25</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-xs text-white/70 mb-1">Card Number</div>
                <div className="text-lg font-mono tracking-wider">•••• •••• •••• 4242</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/70 mb-1">Cardholder</div>
                  <div className="text-sm font-medium">John Doe</div>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Secure</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Payment method verified</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              This card is ready for automatic payments and recharges
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* No Payment Method State */}
          <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Payment Method</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No payment method has been saved for this account.
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </button>
          </div>

          {/* Warning Status */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Payment method required</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              A payment method is required for automatic payments and recharges
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
