"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, CheckCircle, XCircle, Calendar, Calculator } from "lucide-react";
import { useMetronome } from "@/hooks/use-metronome-config";
import { formatCurrency } from "@/lib/utils";

interface BillableMetric {
  id: string;
  name: string;
}

interface BillableMetricDetails {
  id: string;
  name: string;
  description?: string;
  aggregation_type?: string;
  event_type_filter?: any;
  numeric_filters?: any[];
  categorical_filters?: any[];
  property_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface FilterInput {
  name: string;
  in_values: string[];
  selectedValue: string;
}

interface UsageDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  billableMetrics: BillableMetric[];
  mode?: "send" | "forecast";
}

export function UsageDataModal({ 
  isOpen, 
  onClose, 
  billableMetrics,
  mode = "send"
}: UsageDataModalProps) {
  const { fetchBillableMetric, sendUsageData, previewEvents } = useMetronome();
  const [selectedMetricId, setSelectedMetricId] = useState<string>("");
  const [metricDetails, setMetricDetails] = useState<BillableMetricDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterInputs, setFilterInputs] = useState<FilterInput[]>([]);
  const [sentEvents, setSentEvents] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [forecastResult, setForecastResult] = useState<any>(null);

  const handleClose = () => {
    setSelectedMetricId("");
    setMetricDetails(null);
    setError(null);
    setSuccess(null);
    setFilterInputs([]);
    setSentEvents([]);
    setSelectedDate("");
    setForecastResult(null);
    setIsSending(false);
    onClose();
  };

  const handleMetricSelect = async (metricId: string) => {
    setSelectedMetricId(metricId);
    setError(null);
    setSuccess(null);
    
    if (!metricId) {
      setMetricDetails(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchBillableMetric(metricId);
      setMetricDetails(result);
      
      // Initialize filter inputs from the metric details
      const inputs: FilterInput[] = [];
      
        // Add property filters
        if (result.property_filters) {
          result.property_filters.forEach((property: any) => {
            // Ensure in_values is always an array
            inputs.push({
              name: property.name,
              in_values: property.in_values || [],
              selectedValue: property.in_values?.length >0 ? property.in_values[0] : ''
            });
          });
        }
      
      setFilterInputs(inputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setMetricDetails(null);
      setFilterInputs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (index: number, field: 'selectedValue', newValue: string) => {
    setFilterInputs(prev => prev.map((input, i) => 
      i === index ? { ...input, [field]: newValue } : input
    ));
  };


  const handleSendUsageData = async () => {
    if (!selectedMetricId) return;
    
    setIsSending(true);
    setError(null);
    setSuccess(null);
    setForecastResult(null);
    
    try {
      // Prepare properties from filter inputs
      const properties: Record<string, any> = {};
      filterInputs.forEach(input => {
        if (input.selectedValue) {
          properties[input.name] = input.selectedValue;
        }
      });
      
      const timestamp = selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString();
      
      if (mode === "forecast") {
        // Preview events for cost forecasting
        const events = [{
          event_type: metricDetails?.event_type_filter?.in_values[0] || "usage_event",
          timestamp: timestamp,
          properties: properties
        }];
        
        const result = await previewEvents(events);
        setForecastResult(result);
        setSuccess("Cost forecast generated successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        // Send usage data
        const result = await sendUsageData(
          metricDetails?.event_type_filter?.in_values[0],
          properties, 
          timestamp,
        );
        
        // Add the transaction ID to the list of sent events
        const transactionId = result.usage.transaction_id;
        setSentEvents(prev => [...prev, transactionId]);
        
        setSuccess(`Usage data sent successfully! Transaction ID: ${transactionId}`);
        
        // Clear success message after 2 seconds but keep the modal open
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode === "forecast" ? "forecast costs" : "send usage data"}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {mode === "forecast" ? (
              <>
                <Calculator className="w-5 h-5" />
                <span>Forecast Costs</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Usage Data</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "forecast" 
              ? "Select a billable metric to preview how events would be processed and see cost forecasts."
              : "Select a billable metric to view its details and send usage data."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Billable Metric Selection */}
          <div className="space-y-2">
            <Label htmlFor="metric-select">Select Billable Metric</Label>
            <Select value={selectedMetricId} onValueChange={handleMetricSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a billable metric..." />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" sideOffset={4} avoidCollisions={true}>
                {billableMetrics.map((metric) => (
                  <SelectItem key={metric.id} value={metric.id}>
                    {metric.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="usage-date" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Usage Date (Optional)</span>
            </Label>
            <Input
              id="usage-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              min={new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="text-sm"
              placeholder="Select a date (up to 34 days ago)"
            />
            <p className="text-xs text-gray-500">
              Leave empty to use current time. Select a date up to 34 days in the past.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800 font-medium">Error</p>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-800 font-medium">Success</p>
              </div>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Loading metric details...</p>
              </div>
            </div>
          )}

          {/* Metric Details */}
          {metricDetails && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Metric Details</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Name</Label>
                    <p className="text-sm text-gray-900 mt-1">{metricDetails.name}</p>
                  </div>
                  
                  {metricDetails.aggregation_type && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Aggregation Type</Label>
                      <p className="text-sm text-gray-900 mt-1 capitalize">
                        {metricDetails.aggregation_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                  
                  {metricDetails.event_type_filter?.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Event Name</Label>
                      <p className="text-sm text-gray-900 mt-1">{metricDetails.event_type_filter.join(', ')}</p>
                    </div>
                  )}
                </div>

                {/* Property Filter Inputs */}
                {filterInputs.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Event Builder</Label>
                    <div className="space-y-3">
                      {filterInputs.map((input, index) => (
                        <div key={index} className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 capitalize">
                            {input.name.replace(/_/g, ' ')}
                          </Label>
                          {Array.isArray(input.in_values) && input.in_values.length > 0 ? (
                            // Show dropdown when multiple values are available
                            <Select
                              value={input.selectedValue}
                              onValueChange={(value) => handleFilterChange(index, 'selectedValue', value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder={`Select ${input.name}`} />
                              </SelectTrigger>
                              <SelectContent side="bottom" align="start" sideOffset={4} avoidCollisions={true}>
                                {input.in_values.map((value) => (
                                  <SelectItem key={value} value={String(value)}>
                                    {String(value)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            // Show input when single value or no predefined values
                            <Input
                              value={input.selectedValue}
                              onChange={(e) => handleFilterChange(index, 'selectedValue', e.target.value)}
                              placeholder={`Enter ${input.name} value`}
                              className="text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
             
            </div>
          )}

          {/* Sent Events List */}
          {sentEvents.length > 0 && mode === "send" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-medium text-green-900">Sent Events ({sentEvents.length})</h4>
              </div>
              <div className="space-y-2">
                {sentEvents.map((eventId, index) => (
                  <div key={eventId} className="flex items-center space-x-2 text-sm">
                    <span className="text-green-700 font-mono bg-green-100 px-2 py-1 rounded">
                      {eventId}
                    </span>
                    <span className="text-green-600">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forecast Results */}
          {forecastResult && mode === "forecast" && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calculator className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-medium text-purple-900">Cost Forecast Results</h4>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  {/* Line Items */}
                  {forecastResult.data.line_items && forecastResult.data.line_items.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-600 border-b border-gray-200 pb-2">
                        <div>Name</div>
                        <div className="text-right">Quantity</div>
                        <div className="text-right">Unit Price</div>
                        <div className="text-right">Total</div>
                      </div>
                      {forecastResult.data.line_items
                        .filter((item: any) => item.total !== 0)
                        .map((item: any, index: number) => (
                          <div key={index} className="grid grid-cols-4 gap-4 text-sm py-2 border-b border-gray-100 last:border-b-0">
                            <div className="font-medium text-gray-900 truncate" title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-right text-gray-700">
                              {item.quantity || ''}
                            </div>
                            <div className="text-right text-gray-700">
                              {item.unit_price ? `${formatCurrency(item.unit_price, item.credit_type.name)}` : ''}
                            </div>
                            <div className="text-right font-semibold text-gray-900">
                              {item.total ? `${formatCurrency(item.total, item.credit_type.name)}` : ''}
                            </div>
                          </div>
                        ))}
                      
                      {/* Total Impact */}
                      <div className="grid grid-cols-4 gap-4 text-sm py-3 border-t-2 border-purple-200 bg-purple-50 rounded-lg px-3 mt-4">
                        <div className="font-bold text-purple-900">Total Impact</div>
                        <div></div>
                        <div></div>
                        <div className="text-right font-bold text-purple-900">
                          {`${formatCurrency(forecastResult.data.total, forecastResult.data.credit_type.name)}`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No line items found in forecast results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendUsageData}
            disabled={!selectedMetricId || isLoading || isSending}
            className="w-full sm:w-auto"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "forecast" ? "Forecasting..." : "Sending..."}
              </>
            ) : (
              <>
                {mode === "forecast" ? (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    {forecastResult ? "Generate New Forecast" : "Forecast Costs"}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {sentEvents.length > 0 ? `Send Another Event (${sentEvents.length} sent)` : "Send Usage Data"}
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
