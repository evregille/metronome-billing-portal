"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMetronome } from "@/hooks/use-metronome-config";
import { Package, Loader2, RefreshCw } from "lucide-react";

export function ManagedSubscription() {
  const { 
    config,
    loadingStates, 
    updateSubscriptionQuantity
  } = useMetronome();
  const [updatingQuantities, setUpdatingQuantities] = useState<Set<string>>(new Set());
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({});

  // Get subscriptions from contract details in config
  const subscriptions = config.contract_details?.subscriptions || [];
  const contractId = config.contract_details?.id;

  console.log("contractData", config.contract_details);

  const handleQuantityChange = (subscriptionId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setPendingQuantities(prev => ({
      ...prev,
      [subscriptionId]: newQuantity
    }));
  };

  const handleUpdateQuantity = async (subscriptionId: string, newQuantity: number) => {
    if (!contractId) return;
    
    setUpdatingQuantities(prev => new Set(prev).add(subscriptionId));
    
    try {
      await updateSubscriptionQuantity(
        contractId,
        subscriptionId,
        newQuantity
      );
      
      // Clear the pending quantity after successful update
      setPendingQuantities(prev => {
        const newPending = { ...prev };
        delete newPending[subscriptionId];
        return newPending;
      });
      
    } catch (err) {
      console.error("Error updating quantity:", err);
    } finally {
      setUpdatingQuantities(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscriptionId);
        return newSet;
      });
    }
  };


  const getStatusColor = (collectionSchedule: string) => {
    switch (collectionSchedule.toUpperCase()) {
      case "ADVANCE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "ARREARS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getCurrentQuantity = (quantitySchedule: Array<{quantity: number; starting_at: string}>) => {
    if (!quantitySchedule || quantitySchedule.length === 0) return 0;
    
    // Get the most recent quantity (last item in the schedule)
    const sortedSchedule = [...quantitySchedule].sort((a, b) => 
      new Date(b.starting_at).getTime() - new Date(a.starting_at).getTime()
    );
    
    return sortedSchedule[0].quantity;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loadingStates.contractDetails) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Managed Subscriptions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading subscription data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Loading subscription data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!config.contract_details || subscriptions.length === 0) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Managed Subscriptions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">No active subscriptions found</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Active Subscriptions</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No subscriptions are currently active for this contract.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card card-hover rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Managed Subscriptions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your subscription quantities</p>
        </div>
      </div>
      <div className={`grid gap-6 ${subscriptions.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {subscriptions.map((subscription: any) => {
            const currentQuantity = getCurrentQuantity(subscription.quantity_schedule);
            const pendingQuantity = pendingQuantities[subscription.id];
            const displayQuantity = pendingQuantity !== undefined ? pendingQuantity : currentQuantity;
            const hasChanges = pendingQuantity !== undefined && pendingQuantity !== currentQuantity;
            
            return (
              <div
                key={subscription.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{subscription.subscription_rate.product.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(subscription.collection_schedule)}>
                        {subscription.collection_schedule}
                      </Badge>
                      <Badge variant="outline">
                        {subscription.subscription_rate.billing_frequency}
                      </Badge>
                      {subscription.proration.is_prorated && (
                        <Badge variant="secondary">
                          Prorated
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subscription Period</p>
                    <p className="text-sm">
                      {formatDate(subscription.starting_at)} - {(subscription.ending_before) ? formatDate(subscription.ending_before) : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Invoice Behavior</p>
                    <p className="text-sm">
                      {subscription.proration.invoice_behavior.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(subscription.id, displayQuantity - 1)}
                        disabled={displayQuantity <= 0 || updatingQuantities.has(subscription.id)}
                      >
                        -
                      </Button>
                      <span className={`min-w-[3rem] text-center font-medium ${hasChanges ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {updatingQuantities.has(subscription.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
                        ) : (
                          displayQuantity
                        )}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(subscription.id, displayQuantity + 1)}
                        disabled={updatingQuantities.has(subscription.id)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleUpdateQuantity(subscription.id, displayQuantity)}
                    disabled={updatingQuantities.has(subscription.id) || !hasChanges}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 rounded-lg font-medium shadow-lg transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600"
                  >
                    {updatingQuantities.has(subscription.id) ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Update Quantity
                      </>
                    )}
                  </Button>
                </div>

                {subscription.quantity_schedule.length > 1 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-medium mb-1">Quantity History:</p>
                    {subscription.quantity_schedule.map((schedule: any, index: number) => (
                      <div key={index} className="ml-2">
                        {schedule.quantity} units from {formatDate(schedule.starting_at)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
