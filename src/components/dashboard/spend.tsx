"use client";

import { useEffect } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Package, Target, Bell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function Spend() {
  const { currentSpend, fetchCurrentSpend } = useMetronome();

  useEffect(() => {
    (async () => {
      await fetchCurrentSpend();
    })();
  }, [fetchCurrentSpend]);

  const totalSpend = currentSpend?.total || 0;
  const productCount = currentSpend?.productTotals ? Object.keys(currentSpend.productTotals).length : 0;

  // Prepare data for the chart
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-blue-600">
            <span className="font-medium">Amount:</span> {data.formattedValue}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Percentage:</span> {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

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

      {/* Vertical Stacked Bar Chart */}
      {chartData.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-900">Spend by Product</h4>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis hide />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-xs text-gray-600 truncate">{item.name}</span>
                <span className="text-xs font-semibold text-gray-900 ml-auto">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget and Alerts Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-4 h-4 text-gray-600" />
          <h4 className="text-sm font-semibold text-gray-900">Budget & Alerts</h4>
        </div>

        <div className="space-y-4">
          {/* Budget Setting */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-sm font-semibold text-gray-900">Monthly Budget</h5>
                <p className="text-xs text-gray-600">Set a spending limit for this month</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                placeholder="Enter amount" 
                className="flex-1"
                defaultValue="5000"
              />
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Set Budget
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
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Period total</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(totalSpend)}
          </span>
        </div>
      </div>
    </div>
  );
}
