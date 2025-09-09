"use client";

import { useEffect, useState } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Package, Target, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function Spend() {
  const { currentSpend, fetchCurrentSpend } = useMetronome();
  const [budgetAmount, setBudgetAmount] = useState("5000");

  useEffect(() => {
    (async () => {
      await fetchCurrentSpend();
    })();
  }, [fetchCurrentSpend]);

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

      {/* Budget & Alerts Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget & Alerts</h3>
        
        {/* Monthly Budget Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-base font-semibold text-gray-900">Monthly Budget</h4>
              <p className="text-sm text-gray-600">Set a spending limit for this month</p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center space-x-3">
            <Input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="flex-1"
              placeholder="5000"
            />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Set Budget
            </Button>
          </div>
        </div>

        {/* Spend Alerts Card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-4 h-4 text-gray-600" />
            <h4 className="text-base font-semibold text-gray-900">Spend Alerts</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Alert at 75% of budget</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Alert at 90% of budget</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Alert at 100% of budget</span>
              <Switch />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
