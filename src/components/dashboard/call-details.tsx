"use client";

import { useEffect, useState } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Activity, Clock, Package } from "lucide-react";

interface CallDetail {
  id: string;
  name: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
  type: string;
}

export function CallDetails() {
  const { costs, fetchCosts } = useMetronome();
  const [callDetails, setCallDetails] = useState<CallDetail[]>([]);

  useEffect(() => {
    (async () => {
      await fetchCosts();
    })();
  }, [fetchCosts]);

  useEffect(() => {
    if (costs?.items) {
      // Flatten all line items from all breakdowns
      const details: CallDetail[] = costs.items.flatMap((item: any) => 
        (item.line_items || []).map((lineItem: any) => ({
          id: lineItem.id || Math.random().toString(36).substr(2, 9),
          name: lineItem.name || "Unknown",
          product: lineItem.product_name || lineItem.name || "Unknown",
          quantity: lineItem.quantity || 0,
          unitPrice: lineItem.unit_price || 0,
          total: lineItem.total || 0,
          date: item.starting_on,
          type: lineItem.product_type || "Usage",
        }))
      );
      setCallDetails(details);
    }
  }, [costs]);

  const totalCalls = callDetails.length;
  const totalValue = callDetails.reduce((sum, call) => sum + call.total, 0);

  if (!callDetails.length) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Call Details</h3>
            <p className="text-sm text-gray-600">Recent expert calls usage</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">No call details available</p>
            <p className="text-sm text-gray-500">Usage data will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Call Details</h3>
            <p className="text-sm text-gray-600">API usage breakdown</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {totalCalls}
          </div>
          <div className="text-sm text-gray-600">total calls</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-xl font-bold text-gray-900">
            {totalCalls}
          </div>
          <div className="text-sm text-gray-600">Total Calls</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-xl font-bold text-gray-900">
            ${formatCurrency(totalValue)}
          </div>
          <div className="text-sm text-gray-600">Total Value</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-xl font-bold text-gray-900">
            ${formatCurrency(totalValue / totalCalls)}
          </div>
          <div className="text-sm text-gray-600">Avg per Call</div>
        </div>
      </div>

      {/* Call List */}
      <div className="space-y-3">
        {callDetails.slice(0, 8).map((call) => (
          <div
            key={call.id}
            className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-gray-700">
                      {call.product}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(call.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="w-3 h-3" />
                        <span>Qty: {call.quantity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  ${formatCurrency(call.total)}
                </div>
                {call.unitPrice > 0 && (
                  <div className="text-sm text-gray-500">
                    ${formatCurrency(call.unitPrice)}/unit
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {callDetails.length > 8 && (
          <div className="text-center pt-4">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              <Activity className="w-4 h-4 mr-2" />
              Showing 8 of {callDetails.length} calls
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
