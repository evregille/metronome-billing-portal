"use client";

import { useEffect, useState } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Package, Target, Bell, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function Spend() {
  const { 
    currentSpend, 
    alerts,
    fetchCurrentSpend, 
    fetchAlerts,
    createSpendAlert,
    deleteAlert
  } = useMetronome();
  
  const [budgetAmount, setBudgetAmount] = useState("5000");
  const [isEditingAlert, setIsEditingAlert] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(1000);
  const [alertEnabled, setAlertEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      await fetchCurrentSpend();
      await fetchAlerts();
    })();
  }, [fetchCurrentSpend, fetchAlerts]);

  // Initialize alert form when spend alert exists
  useEffect(() => {
    if (alerts?.spendAlert) {
      setAlertThreshold(alerts.spendAlert.alert.threshold || 1000);
      setAlertEnabled(alerts.spendAlert.alert.enabled || false);
      setIsEditingAlert(false);
    }
  }, [alerts?.spendAlert]);

  const totalSpend = currentSpend?.total || 0;
  const productCount = currentSpend?.productTotals ? Object.keys(currentSpend.productTotals).length : 0;

  // Prepare data for horizontal stacked bar
  const chartData = currentSpend?.productTotals ? 
    Object.entries(currentSpend.productTotals).map(([productName, total]) => {
      const percentage = totalSpend > 0 ? (total / totalSpend) * 100 : 0;
      return {
        name: productName,
        value: total,
        percentage: percentage,
        formattedValue: formatCurrency(total)
      };
    }) : [];

  // Define colors for different products
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ];

  const handleCreateAlert = async () => {
    await createSpendAlert(alertThreshold);
    setIsEditingAlert(false);
  };

  const handleDeleteAlert = async () => {
    if (alerts?.spendAlert) {
      await deleteAlert(alerts.spendAlert.alert.id);
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
    <div className="glass-card card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Spend</h3>
            <p className="text-sm text-gray-600">This billing period</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalSpend)}
          </div>
          <div className="text-sm text-gray-600">{productCount} products</div>
        </div>
      </div>

      {/* Horizontal Stacked Bar */}
      {chartData.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-900">Spend by Product</h4>
          </div>

          {/* Stacked Bar */}
          <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
            {chartData.map((item, index) => (
              <div
                key={index}
                className="h-full inline-block"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: colors[index % colors.length],
                }}
                title={`${item.name}: ${item.formattedValue} (${item.percentage.toFixed(1)}%)`}
              />
            ))}
          </div>

          {/* Product List */}
          <div className="space-y-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-semibold text-gray-900">{item.formattedValue}</span>
                  <span className="text-sm text-gray-600 min-w-[3rem] text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



        {/* Spend Alerts Configuration - Updated to match Balance style */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Budget</h4>
            </div>
            {alerts?.spendAlert && (
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertStatusColor(alerts.spendAlert.customer_status)}`}>
                  {getAlertStatusText(alerts.spendAlert.customer_status)}
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
          
          {alerts?.spendAlert ? (
            // Show existing alert
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-medium text-gray-900">Budget</h5>
                  <p className="text-sm text-gray-600">We will notify you if your spending reaches {formatCurrency(alerts.spendAlert.alert.threshold || 0)}</p>
                </div>
              </div>
              
              {isEditingAlert && (
                <div className="space-y-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="spend-threshold" className="text-sm text-gray-600">
                      Alert when spending reaches:
                    </Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">$</span>
                      <Input
                        id="spend-threshold"
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
                      Save Changes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingAlert(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Show create alert form
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-medium text-gray-900">Control your spending</h5>
                  <p className="text-sm text-gray-600">Receive a notification when your spending reaches a threshold</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingAlert(!isEditingAlert)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Set Budget
                </Button>
              </div>
              
              {isEditingAlert && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="spend-threshold" className="text-sm text-gray-600">
                      Alert when spending reaches:
                    </Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">$</span>
                      <Input
                        id="spend-threshold"
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
  );
}
