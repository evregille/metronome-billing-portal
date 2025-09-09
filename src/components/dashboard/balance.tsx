"use client";

import { useEffect, useState, useRef } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Phone, MessageCircle, Package, CheckCircle, ExternalLink, Loader2, Bell, Target, Edit, Trash2, Plus } from "lucide-react";

export function Balance() {
  const { 
    config, 
    balance, 
    alerts,
    fetchBalance, 
    fetchCommitsEmbeddable, 
    fetchAlerts,
    createBalanceAlert,
    deleteAlert,
    commitsEmbeddableUrl, 
    loadingStates 
  } = useMetronome();
  
  const [showEmbeddable, setShowEmbeddable] = useState(false);
  const [isEditingAlert, setIsEditingAlert] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(1000);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      await fetchBalance();
      await fetchAlerts();
    })();
  }, [config, fetchBalance, fetchAlerts]);

  useEffect(() => {
    if (showEmbeddable) {
      (async () => {
        await fetchCommitsEmbeddable();
      })();
    }
  }, [showEmbeddable, config, fetchCommitsEmbeddable]);

  // Calculate dynamic height for iframe
  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.offsetHeight;
        const headerHeight = 120; // Approximate header height
        const toggleHeight = 80; // Approximate toggle section height
        const padding = 48; // Total padding (24px top + 24px bottom)
        const availableHeight = containerHeight - headerHeight - toggleHeight - padding;
        setIframeHeight(Math.max(400, availableHeight));
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [showEmbeddable]);

  // Initialize alert form when balance alert exists
  useEffect(() => {
    if (alerts?.balanceAlert) {
      setAlertThreshold(alerts.balanceAlert.alert.threshold || 1000);
      setAlertEnabled(alerts.balanceAlert.alert.enabled || false);
      setIsEditingAlert(false);
    }
  }, [alerts?.balanceAlert]);

  // Calculate percentage of balance used
  const calculateUsagePercentage = () => {
    if (!balance) return 0;
    const percentage = (balance.total_used / balance.total_granted) * 100;
    return Math.min(percentage, 100);
  };

  const getUsageColor = () => {
    const percentage = calculateUsagePercentage();
    if (percentage >= 90) return "text-yellow-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getUsageBarColor = () => {
    const percentage = calculateUsagePercentage();
    if (percentage >= 90) return "bg-yellow-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleCreateAlert = async () => {
    await createBalanceAlert(alertThreshold);
    setIsEditingAlert(false);
  };

  const handleDeleteAlert = async () => {
    if (alerts?.balanceAlert) {
      await deleteAlert(alerts.balanceAlert.alert.id);
    }
  };

  const getAlertStatusColor = (status?: string | null) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-100';
      case 'in_alarm': return 'text-red-600 bg-red-100';
      case 'evaluating': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getAlertStatusText = (status?: string | null) => {
    switch (status) {
      case 'ok': return 'OK';
      case 'in_alarm': return 'Triggered';
      case 'evaluating': return 'Evaluating';
      default: return 'Unknown';
    }
  };

  console.log(alerts);

  return (
    <div ref={containerRef} className="glass-card card-hover rounded-2xl p-6 h-full">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Account Balance</h3>
            <p className="text-sm text-gray-600">Available funds</p>
          </div>
        </div>
        {balance && (
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(balance.total_granted - balance.total_used)}
            </div>
            <div className="text-sm text-gray-600">remaining</div>
          </div>
        )}
      </div>

      {/* Content - Either balance details or embeddable */}
      {showEmbeddable ? (
        // Show embeddable iframe
        <div className="flex-1">
          {loadingStates.commitsEmbeddable ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading embeddable...</span>
            </div>
          ) : commitsEmbeddableUrl ? (
            <div className="overflow-hidden h-full">
              <iframe
                src={commitsEmbeddableUrl}
                className="w-full"
                style={{ height: `${iframeHeight}px` }}
                title="Metronome Commits Embeddable"
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Failed to load embeddable content</p>
            </div>
          )}
        </div>
      ) : (
        // Show balance details
        balance ? (
          <div className="space-y-6 flex-1">
            {/* Overall Usage */}
            {balance.total_granted > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Usage</span>
                  <span className={`text-sm font-semibold ${getUsageColor()}`}>
                    {calculateUsagePercentage().toFixed(1)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${getUsageBarColor()} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(calculateUsagePercentage(), 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatCurrency(balance.total_used)} used</span>
                  <span>{formatCurrency(balance.total_granted)} granted</span>
                </div>
              </div>
            )}

            {/* Commits Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center">
                  <Package className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Commits Breakdown</h3>
              </div>
              <div className="space-y-4">
                {balance.processed_grants.map((grant, index) => {
                  const usagePercentage = grant.granted > 0 ? (grant.used / grant.granted) * 100 : 0;
                  const isFullyUsed = usagePercentage >= 100;
                  
                  return (
                    <div key={grant.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{grant.product_name}</p>
                            <p className="text-sm text-gray-500">Type: {grant.type.toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${isFullyUsed ? 'text-green-500' : 'text-green-500'}`}>
                            {formatCurrency(grant.remaining)} remaining
                          </p>
                        </div>
                      </div>

                      {/* Usage Section */}
                      {grant.granted > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Usage</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Financial Breakdown */}
                      <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Granted</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(grant.granted)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Used</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(grant.used)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Remaining</p>
                          <p className={`font-semibold ${isFullyUsed ? 'text-green-500' : 'text-green-500'}`}>
                            {formatCurrency(grant.remaining)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Balance Alerts Configuration */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Balance Notifications</h4>
                </div>
                {alerts?.balanceAlert && (
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertStatusColor(alerts.balanceAlert.customer_status)}`}>
                      {getAlertStatusText(alerts.balanceAlert.customer_status)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteAlert}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              {alerts?.balanceAlert ? (
                // Show existing alert
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">Low Balance Notification</h5>
                      <p className="text-sm text-gray-600">We will notify if your balance reaches below {formatCurrency(alerts.balanceAlert.alert.threshold || 0)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Show create alert form
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">Track your balance</h5>
                      <p className="text-sm text-gray-600">Receive a notification when your balance reaches below a threshold</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAlert(!isEditingAlert)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Notification
                    </Button>
                  </div>
                  
                  {isEditingAlert && (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="balance-threshold" className="text-sm text-gray-600">
                          We will notify you when your balance reaches:
                        </Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">$</span>
                          <Input
                            id="balance-threshold"
                            type="number"
                            value={alertThreshold}
                            onChange={(e) => setAlertThreshold(Number(e.target.value))}
                            className="w-24 h-8 text-sm"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={handleCreateAlert}>
                          Create Alert
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingAlert(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <p>No balance data available</p>
          </div>
        )
      )}

      {/* Show Embeddable Toggle - Moved to bottom */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="embeddable-toggle"
              checked={showEmbeddable}
              onCheckedChange={setShowEmbeddable}
            />
            <Label htmlFor="embeddable-toggle" className="text-sm">
              Show Embeddable
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
