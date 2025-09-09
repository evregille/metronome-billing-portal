"use client";

import { useEffect, useState } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Phone, MessageCircle, Package, CheckCircle, ExternalLink, Loader2, Bell, Target } from "lucide-react";

export function Balance() {
  const { config, balance, fetchBalance, fetchCommitsEmbeddable, commitsEmbeddableUrl, loadingStates } = useMetronome();
  const [showEmbeddable, setShowEmbeddable] = useState(false);

  useEffect(() => {
    (async () => {
      await fetchBalance();
    })();
  }, [config, fetchBalance]);

  useEffect(() => {
    if (showEmbeddable) {
      (async () => {
        await fetchCommitsEmbeddable();
      })();
    }
  }, [showEmbeddable, config, fetchCommitsEmbeddable]);

  // Calculate percentage of balance used
  const calculateUsagePercentage = () => {
    if (!balance) return 0;
    const percentage = (balance.total_used / balance.total_granted) * 100;
    return Math.min(percentage, 100);
  };

  const getUsageColor = () => {
    const percentage = calculateUsagePercentage();
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getUsageBarColor = () => {
    const percentage = calculateUsagePercentage();
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (showEmbeddable) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Account Balance</h2>
              <p className="text-sm text-gray-600">Commits & Credits Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
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

        <div className="space-y-4">
          {loadingStates.commitsEmbeddable ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading commits dashboard...</span>
            </div>
          ) : commitsEmbeddableUrl ? (
            <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={commitsEmbeddableUrl}
                className="w-full h-full"
                title="Commits & Credits Dashboard"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p>Failed to load commits dashboard</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {loadingStates.balance ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading balance...</span>
        </div>
      ) : balance ? (
        <div className="space-y-6">
          {/* Main Balance Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Account Balance</h3>
                <p className="text-sm text-gray-600">Available funds</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(balance.total_granted - balance.total_used)}
              </div>
              <div className="text-sm text-gray-600">remaining</div>
            </div>
          </div>

          {/* Overall Usage Section */}
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
                  className={`h-3 rounded-full transition-all duration-300 ${getUsageBarColor()}`}
                  style={{ width: `${calculateUsagePercentage()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>{formatCurrency(balance.total_used)} used</span>
                <span>{formatCurrency(balance.total_granted)} total</span>
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

          {/* Budget Alerts Configuration */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">Balance Alerts</h4>
              </div>
              <Switch />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Label htmlFor="balance-budget-threshold" className="text-sm text-gray-600 min-w-0">
                  Alert when balance usage reaches:
                </Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">%</span>
                  <Input
                    id="balance-budget-threshold"
                    type="number"
                    placeholder="80"
                    className="w-20 h-8 text-sm"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <p>No balance data available</p>
        </div>
      )}
      <div className="border-t border-gray-200 pt-6 mt-6">

     
        <div className="flex items-center justify-between mb-6">
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
