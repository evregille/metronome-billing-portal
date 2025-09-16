"use client";

import { useEffect, useState } from "react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { BarChart3, Loader2, TrendingUp, Send } from "lucide-react";
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
    loadingStates 
  } = useMetronome();
  
  const [showEmbeddable, setShowEmbeddable] = useState(false);
  const [showUsageDataModal, setShowUsageDataModal] = useState(false);


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

  return (
    <div className="glass-card card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usage Analytics</h3>
            <p className="text-sm text-gray-600">Detailed usage metrics and analytics</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUsageDataModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:text-white border-0"
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
            <Label htmlFor="usage-embeddable-toggle" className="text-sm">
              Show Embeddable
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Raw Usage Data Section - Default View */}
        {!showEmbeddable && (
          <div>
            {loadingStates.rawUsageData ? (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">Loading usage data...</p>
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
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No usage data available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {rawUsageData ? `Found ${rawUsageData.total_metrics} metrics but no usage data` : 'No billable metrics found'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Embeddable Dashboard Section */}
        {showEmbeddable && (
          <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
        

            {loadingStates.usageEmbeddable ? (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-600">Loading usage dashboard...</p>
                </div>
              </div>
            ) : usageEmbeddableUrl ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <iframe
                  src={usageEmbeddableUrl}
                  className="w-full h-96"
                  title="Metronome Usage Dashboard"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Failed to load usage dashboard</p>
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
    </div>
  );
}
