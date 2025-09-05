"use client";

import { useEffect } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Phone, MessageCircle, Package, CheckCircle } from "lucide-react";

export function Balance() {
  const { config, balance, fetchBalance } = useMetronome();

  useEffect(() => {
    (async () => {
      await fetchBalance();
    })();
  }, [config, fetchBalance]);
  // Calculate percentage of balance used
  const calculateUsagePercentage = () => {
    if (!balance) return 0;
    const percentage = (balance.total_used / balance.total_granted) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  const usagePercentage = calculateUsagePercentage();
  const isApproachingLimit = usagePercentage > 75;
  const isAtLimit = usagePercentage >= 90;
  const remainingBalance = balance ? balance.total_granted - balance.total_used : 0;
  
  // Simplified conditions - show contact sales if no balance data or balance is 0
  const shouldShowContactSales = !balance || 
                                balance.total_granted === 0 || 
                                (balance.total_granted === 0 && balance.total_used === 0) ||
                                !balance.processed_grants || 
                                balance.processed_grants.length === 0;
  

  return (
    <div className="glass-card card-hover rounded-2xl p-6">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Account Balance</h3>
            <p className="text-sm text-gray-600">Available funds</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            ${formatCurrency(remainingBalance)}
          </div>
          <div className="text-sm text-gray-600">remaining</div>
        </div>
      </div>

      {/* Contact Sales Message - Show this when there's no balance or balance is 0 */}
      {shouldShowContactSales && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No Account Balance
            </h4>
            <p className="text-gray-600 mb-4">
              Your account doesn&apos;t have any balance set up yet. Contact our sales team to get started with your billing setup.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                onClick={() => window.open('mailto:sales@alpha-sense.com?subject=Account Setup - Billing Inquiry', '_blank')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact Sales
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('https://www.alpha-sense.com/contact', '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Get Support
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overall Progress Section - Only show if there's a valid balance */}
      {balance && balance.total_granted > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Overall Usage</span>
            <span className="text-sm font-semibold text-gray-900">
              {usagePercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="relative">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAtLimit
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : isApproachingLimit
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500"
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              ${formatCurrency(balance.total_used)} used
            </span>
            <span className="text-gray-600">
              ${formatCurrency(balance.total_granted)} total
            </span>
          </div>
        </div>
      )}

      {/* Status and Action - Only show if there's a valid balance */}
      {balance && balance.total_granted > 0 && (
        <div className="mb-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-50"
            >
              Set Alerts
            </Button>
          </div>
        </div>
      )}

      {/* Commit Breakdown - Show when there are commits - Full row layout */}
      {balance && balance.processed_grants && balance.processed_grants.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-900">Commit Breakdown</h4>
          </div>

          <div className="space-y-4">
            {balance.processed_grants.map((commit, index) => {
              const commitUsagePercentage = commit.granted > 0 ? (commit.used / commit.granted) * 100 : 0;
              const isCommitAtLimit = commitUsagePercentage >= 90;
              const isCommitApproachingLimit = commitUsagePercentage > 75;
              
              return (
                <div key={commit.id} className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900">{commit.product_name}</h5>
                        <p className="text-xs text-gray-600">Type: {commit.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${formatCurrency(commit.remaining)}
                      </div>
                      <div className="text-xs text-gray-600">remaining</div>
                    </div>
                  </div>

                  {/* Progress Bar for this commit */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Usage</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {commitUsagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCommitAtLimit
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : isCommitApproachingLimit
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gradient-to-r from-emerald-500 to-teal-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, commitUsagePercentage))}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">${formatCurrency(commit.granted)}</div>
                      <div className="text-gray-600">Granted</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">${formatCurrency(commit.used)}</div>
                      <div className="text-gray-600">Used</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-emerald-600">${formatCurrency(commit.remaining)}</div>
                      <div className="text-gray-600">Remaining</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
