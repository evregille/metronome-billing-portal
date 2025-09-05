"use client";

import { useState, useEffect } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Target, Bell, AlertTriangle } from "lucide-react";

export function BudgetAlerts() {
  const { alerts, fetchAlerts, createAlert } = useMetronome();
  const [isSpendAlertOn, setIsSpendAlertOn] = useState<boolean>(false);
  const [currentThreshold, setCurrentThreshold] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      await fetchAlerts();
    })();
  }, [fetchAlerts]);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setIsSpendAlertOn(true);
      setCurrentThreshold(alerts[0]?.alert?.threshold || 1000);
    }
  }, [alerts]);

  const handleToggle = () => {
    setIsSpendAlertOn(!isSpendAlertOn);
  };

  const handleCreateAlert = async () => {
    if (!currentThreshold || currentThreshold <= 0) {
      alert("Please enter a valid threshold amount");
      return;
    }

    setIsLoading(true);
    setIsSuccess(false);

    try {
      const alertData = {
        name: "Monthly Spend Alert",
        threshold: currentThreshold,
        enabled: isSpendAlertOn,
      };

      await createAlert(alertData);
      setIsSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to create alert:", error);
      alert("Failed to create alert. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Budget & Alerts</h3>
            <p className="text-sm text-gray-600">Manage spending limits</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${currentThreshold.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">threshold</div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="text-sm font-semibold text-gray-900">Monthly Budget</h5>
              <p className="text-xs text-gray-600">Set a spending limit for this month</p>
            </div>
            <Switch checked={isSpendAlertOn} onCheckedChange={handleToggle} />
          </div>
          <div className="flex items-center space-x-2">
            <Input 
              type="number" 
              placeholder="Enter amount" 
              className="flex-1"
              value={currentThreshold}
              onChange={(e) => setCurrentThreshold(Number(e.target.value))}
            />
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCreateAlert}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Set Budget"}
            </Button>
          </div>
        </div>

        {/* Alert Settings */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <h5 className="text-sm font-semibold text-gray-900">Spend Alerts</h5>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="alert-75" className="text-sm text-gray-700">
                Alert at 75% of budget
              </Label>
              <Switch id="alert-75" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="alert-90" className="text-sm text-gray-700">
                Alert at 90% of budget
              </Label>
              <Switch id="alert-90" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="alert-100" className="text-sm text-gray-700">
                Alert at 100% of budget
              </Label>
              <Switch id="alert-100" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                Budget alert created successfully!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Current threshold</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            ${currentThreshold.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
