"use client";

import { useEffect, useState } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { BarChart3, Loader2, TrendingUp, Send, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UsageChart } from "@/components/charts/usage-chart";
import { UsageDataModal } from "@/components/usage-data-modal";

export function Usage() {
  const { 
    config, 
    usageEmbeddableUrl, 
    rawUsageData,
    fetchUsageEmbeddable, 
    fetchRawUsageData,
    loadingStates,
    isCustomerTransitioning
  } = useMetronome();
  
  const [showEmbeddable, setShowEmbeddable] = useState(false);
  const [showUsageDataModal, setShowUsageDataModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [showCorrectUsageModal, setShowCorrectUsageModal] = useState(false);


  useEffect(() => {
    if (showEmbeddable) {
      (async () => {
        await fetchUsageEmbeddable();
      })();
    } 
  }, [showEmbeddable, config, fetchUsageEmbeddable]);

  useEffect(() => {
    // Always fetch raw usage data on component mount and when customer changes
    (async () => {
      await fetchRawUsageData();
    })();
  }, [config, fetchRawUsageData]);

  // Show loading state during customer transition
  if (isCustomerTransitioning) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usage Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Detailed usage metrics and analytics</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Loading customer data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usage Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Detailed usage metrics and analytics</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCorrectUsageModal(true)}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white hover:text-white border-0"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Correct Usage
          </Button> */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForecastModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:text-white border-0"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Forecast Costs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUsageDataModal(true)}
            className="bg-green-800 hover:bg-green-900 text-white border-0"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Usage Data
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              id="usage-embeddable-toggle"
              checked={showEmbeddable}
              onCheckedChange={setShowEmbeddable}
            />
            <Label htmlFor="usage-embeddable-toggle" className="text-sm text-gray-700 dark:text-gray-200">
              Show Metronome Embeddable UI
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Raw Usage Data Section - Default View */}
        {!showEmbeddable && (
          <div>
            {loadingStates.rawUsageData ? (
              <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Loading usage data...</p>
                </div>
              </div>
            ) : rawUsageData && rawUsageData.usage_data.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-96">
                {rawUsageData.usage_data.map((metricData, index) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <UsageChart
                      key={metricData.billable_metric.id}
                      data={metricData.raw_usage_data}
                      metricName={metricData.billable_metric.name}
                      totalValue={metricData.aggregated_value}
                      color={color}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No usage data available</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {rawUsageData ? `Found ${rawUsageData.total_metrics} metrics but no usage data` : 'No billable metrics found'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Embeddable Dashboard Section */}
        {showEmbeddable && (
          <div className="h-96">
            {loadingStates.usageEmbeddable ? (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Loading usage dashboard...</p>
                </div>
              </div>
            ) : usageEmbeddableUrl ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full">
                <iframe
                  src={usageEmbeddableUrl}
                  className="w-full h-full"
                  title="Metronome Usage Dashboard"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Failed to load usage dashboard</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => fetchUsageEmbeddable()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Usage Data Modal */}
      <UsageDataModal
        isOpen={showUsageDataModal}
        onClose={() => setShowUsageDataModal(false)}
        billableMetrics={rawUsageData?.usage_data?.map(data => data.billable_metric) || []}
      />

      {/* Forecast Costs Modal */}
      <UsageDataModal
        isOpen={showForecastModal}
        onClose={() => setShowForecastModal(false)}
        billableMetrics={rawUsageData?.usage_data?.map(data => data.billable_metric) || []}
        mode="forecast"
      />

      {/* Correct Usage Modal */}
      <UsageDataModal
        isOpen={showCorrectUsageModal}
        onClose={() => setShowCorrectUsageModal(false)}
        billableMetrics={rawUsageData?.usage_data?.map(data => data.billable_metric) || []}
        mode="correct"
      />
    </div>
  );
}
