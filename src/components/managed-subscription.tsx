"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMetronome } from "@/hooks/use-metronome-config";

export function ManagedSubscription() {
  const { 
    contractSubscriptions, 
    loadingStates, 
    fetchContractSubscriptions,
    updateSubscriptionQuantity
  } = useMetronome();
  const [updatingQuantities, setUpdatingQuantities] = useState<Set<string>>(new Set());
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchContractSubscriptions();
  }, [fetchContractSubscriptions]);

  console.log("contractData", contractSubscriptions);

  const handleQuantityChange = (subscriptionId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setPendingQuantities(prev => ({
      ...prev,
      [subscriptionId]: newQuantity
    }));
  };

  const handleUpdateQuantity = async (subscriptionId: string, newQuantity: number) => {
    if (!contractSubscriptions?.contract_id) return;
    
    setUpdatingQuantities(prev => new Set(prev).add(subscriptionId));
    
    try {
      await updateSubscriptionQuantity(
        contractSubscriptions.contract_id,
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

  if (loadingStates.contractSubscriptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Managed Subscriptions</CardTitle>
          <CardDescription>Loading subscription data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contractSubscriptions || contractSubscriptions.subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Managed Subscriptions</CardTitle>
          <CardDescription>No active subscriptions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No subscriptions are currently active for this contract.
            </p>
            <Button onClick={fetchContractSubscriptions} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Managed Subscriptions</CardTitle>
        <CardDescription>
          Manage your subscription quantities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contractSubscriptions.subscriptions.map((subscription) => {
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
                      {formatDate(subscription.starting_at)} - {formatDate(subscription.ending_before)}
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
                    size="sm"
                    onClick={() => handleUpdateQuantity(subscription.id, displayQuantity)}
                    disabled={updatingQuantities.has(subscription.id) || !hasChanges}
                    variant={hasChanges ? "default" : "outline"}
                    className="w-full"
                  >
                    Update Quantity
                  </Button>
                </div>

                {subscription.quantity_schedule.length > 1 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-medium mb-1">Quantity History:</p>
                    {subscription.quantity_schedule.map((schedule, index) => (
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
      </CardContent>
    </Card>
  );
}
