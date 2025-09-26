"use client";

import { useEffect, useState, useRef } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency, getCoinSymbol } from "@/lib/utils";
import { Wallet, Package, CheckCircle, ExternalLink, Loader2, Bell, Trash2 } from "lucide-react";
import { RechargeModal } from "@/components/recharge-modal";

export function Balance() {
  const { 
    config, 
    balance, 
    alerts,
    fetchBalance, 
    fetchCommitsEmbeddable, 
    fetchAlerts,
    rechargeBalance,
    updateAutoRecharge,
    createBalanceAlert,
    deleteAlert,
    commitsEmbeddableUrl, 
    loadingStates,
    isCustomerTransitioning,
    rechargeProductId
  } = useMetronome();
  
  const [showEmbeddable, setShowEmbeddable] = useState(false);
  const [isEditingAlert, setIsEditingAlert] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(1000);
  const [, setAlertEnabled] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showAutoRechargeModal, setShowAutoRechargeModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if auto recharge is already configured
  const autoRechargeConfig = config.contract_details?.prepaid_balance_threshold_configuration;
  const hasAutoRechargeConfig = !!autoRechargeConfig; // Check if config exists regardless of enabled state

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

  const handleRecharge = async (amount: number, threshold?: number) => {
    try {
      await rechargeBalance(amount, threshold);
      return {
        success: true,
        message: threshold 
          ? "Auto recharge configured successfully! Your balance will be automatically recharged when it falls below the threshold."
          : `Successfully recharged ${formatCurrency(amount, balance?.currency_name || "USD")} to your account.`
      };
    } catch (error) {
      // The error message from the hook should already be user-friendly
      const errorMessage = error instanceof Error ? error.message : "Failed to recharge balance. Please try again.";
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const handleUpdateAutoRecharge = async (isEnabled?: boolean, thresholdAmount?: number, rechargeToAmount?: number) => {
    try {
      await updateAutoRecharge(isEnabled, thresholdAmount, rechargeToAmount);
      return {
        success: true,
        message: isEnabled === false 
          ? "Auto recharge has been disabled successfully."
          : "Auto recharge configuration has been updated successfully."
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update auto recharge"
      };
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

  // Show loading state during customer transition
  if (isCustomerTransitioning) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account Balance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available funds</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">Loading customer data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="glass-card card-hover rounded-2xl p-6 h-full">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account Balance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Available funds</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {balance 
              ? formatCurrency(balance.total_granted - balance.total_used, balance.currency_name)
              : formatCurrency(0, "USD")
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">remaining</div>

          {/* Recharge Buttons - Always visible */}
          <div className="flex space-x-2">
            <Button 
              className="bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm"
              onClick={() => setShowRechargeModal(true)}
            >
              <Wallet className="w-3 h-3 mr-1.5" />
              Recharge
            </Button>
            <Button 
              className="bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm"
              onClick={() => setShowAutoRechargeModal(true)}
            >
              <Wallet className="w-3 h-3 mr-1.5" />
              {hasAutoRechargeConfig ? "Update Auto Recharge" : "Auto Recharge"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content - Either balance details or embeddable */}
      {showEmbeddable ? (
        // Show embeddable iframe
        <div className="flex-1">
          {loadingStates.commitsEmbeddable ? (
            <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Loading embeddable dashboard...</p>
              </div>
            </div>
          ) : commitsEmbeddableUrl ? (
            <div className="overflow-hidden rounded-lg h-96 bg-white dark:bg-gray-800">
              <iframe
                src={commitsEmbeddableUrl}
                className="w-full h-full"
                title="Metronome Commits Embeddable"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <ExternalLink className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Failed to load embeddable dashboard</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => fetchCommitsEmbeddable()}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Show balance details
        balance ? (
          <div className="space-y-6 flex-1 min-h-96">
            {/* Overall Usage */}
            {balance.total_granted > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Usage</span>
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
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatCurrency(balance.total_used, balance.currency_name)} used</span>
                  <span>{formatCurrency(balance.total_granted, balance.currency_name)} granted</span>
                </div>
              </div>
            )}

            {/* Commits Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center">
                  <Package className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Commits Breakdown</h3>
              </div>
              <div className="space-y-4">
                {balance.processed_grants.map((grant) => {
                  const usagePercentage = grant.granted > 0 ? (grant.used / grant.granted) * 100 : 0;
                  const isFullyUsed = usagePercentage >= 100;
                  
                  return (
                    <div key={grant.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{grant.product_name}</p>
                            <p className="text-sm text-gray-500">Type: {grant.type.toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${isFullyUsed ? 'text-green-500' : 'text-green-500'}`}>
                            {formatCurrency(grant.remaining, balance.currency_name)} remaining
                          </p>
                        </div>
                      </div>

                      {/* Usage Section */}
                      {grant.granted > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Usage</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(grant.granted, balance.currency_name)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Used</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(grant.used, balance.currency_name)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Remaining</p>
                          <p className={`font-semibold ${isFullyUsed ? 'text-green-500' : 'text-green-500'}`}>
                            {formatCurrency(grant.remaining, balance.currency_name)}
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
                  <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Balance Notifications</h4>
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
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-100">Low Balance Notification</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">We will notify if your balance reaches below {formatCurrency(alerts.balanceAlert.alert.threshold || 0, balance.currency_name)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Show create alert form
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-100">Track your balance</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive a notification when your balance reaches below a threshold</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAlert(!isEditingAlert)}
                    >
                      Create
                    </Button>
                  </div>
                  
                  {isEditingAlert && (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="balance-threshold" className="text-sm text-gray-600 dark:text-gray-400">
                          We will notify you when your balance reaches:
                        </Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{getCoinSymbol(balance.currency_name)}</span>
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
                        <Button 
                          className="bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm"
                          onClick={handleCreateAlert}
                        >
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
          <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <Wallet className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No balance data available</p>
            </div>
          </div>
        )
      )}

      {/* Show Embeddable Toggle - Moved to bottom */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Switch
              id="embeddable-toggle"
              checked={showEmbeddable}
              onCheckedChange={setShowEmbeddable}
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-400 dark:data-[state=unchecked]:bg-gray-600"
            />
            <Label htmlFor="embeddable-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Show Embeddable
            </Label>
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onRecharge={handleRecharge}
        currencyName={balance?.currency_name || "USD"}
        currentBalance={balance ? balance.total_granted - balance.total_used : 0}
        rechargeProductId={rechargeProductId}
      />

      {/* Auto Recharge Modal */}
      <RechargeModal
        isOpen={showAutoRechargeModal}
        onClose={() => setShowAutoRechargeModal(false)}
        onRecharge={handleRecharge}
        onUpdateAutoRecharge={handleUpdateAutoRecharge}
        currencyName={balance?.currency_name || "USD"}
        currentBalance={balance ? balance.total_granted - balance.total_used : 0}
        rechargeProductId={rechargeProductId}
        isAutoRecharge={true}
        existingAutoRecharge={autoRechargeConfig}
      />
    </div>
  );
}
