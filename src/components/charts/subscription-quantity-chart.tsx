"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

interface SubscriptionQuantityChartProps {
  contractId: string;
  subscriptionId: string;
  fetchSubscriptionQuantityHistory: (contractId: string, subscriptionId: string) => Promise<any>;
  quantitySchedule?: Array<{quantity: number; starting_at: string}>;
}

interface QuantityHistoryEntry {
  quantity?: number;
  qty?: number;
  value?: number;
  amount?: number;
  count?: number;
  starting_at?: string;
  starting_on?: string;
  date?: string;
  timestamp?: string;
  [key: string]: any; // Allow any other fields
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  // Display in UTC timezone to match Metronome
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    timeZone: 'UTC'
  } as Intl.DateTimeFormatOptions);
}

function processHistoryData(history: QuantityHistoryEntry[]): Array<{date: string, quantity: number, fullDate: string}> {
  if (!history || history.length === 0) {
    console.log("processHistoryData: No history data");
    return [];
  }
  
  console.log("processHistoryData: Processing", history.length, "entries");
  console.log("processHistoryData: Sample entry", history[0]);
  
  // Sort by date - handle different possible date field names
  const sorted = [...history].sort((a, b) => {
    const dateA = a.starting_at || a.starting_on || a.date || a.timestamp || '';
    const dateB = b.starting_at || b.starting_on || b.date || b.timestamp || '';
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
  
  // Transform to chart data format - sum quantities from data array
  const chartData = sorted.map((entry, index) => {
    const dateStr = entry.starting_at || entry.starting_on || entry.date || entry.timestamp || '';
    
    // Extract quantity - sum all quantities from the data array
    let qty = 0;
    if (entry.data && Array.isArray(entry.data) && entry.data.length > 0) {
      // Sum all quantities in the data array
      qty = entry.data.reduce((sum: number, item: any) => {
        const itemQty = item?.quantity !== undefined ? item.quantity
          : item?.qty !== undefined ? item.qty
          : item?.value !== undefined ? item.value
          : item?.amount !== undefined ? item.amount
          : item?.count !== undefined ? item.count
          : (typeof item === 'number' ? item : 0);
        return sum + itemQty;
      }, 0);
    } else {
      // Fallback: try multiple possible quantity field names directly on entry
      qty = entry.quantity !== undefined ? entry.quantity 
        : entry.qty !== undefined ? entry.qty 
        : entry.value !== undefined ? entry.value
        : entry.amount !== undefined ? entry.amount
        : entry.count !== undefined ? entry.count
        : 0;
    }
    
    console.log(`Processing entry ${index}: date="${dateStr}", quantity=${qty}`);
    
    const formattedDate = formatDate(dateStr);
    const fullDate = dateStr ? new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Display in UTC to match Metronome
    }) : '';
    
    return {
      date: formattedDate,
      quantity: qty,
      fullDate: fullDate,
      // Add raw date for sorting/grouping if needed
      rawDate: dateStr,
    };
  });
  
  // Filter out invalid entries
  let validChartData = chartData.filter(entry => entry.rawDate && entry.quantity !== undefined);
  
  // Add today's data point with the latest quantity value if we have data
  if (validChartData.length > 0) {
    const lastEntry = validChartData[validChartData.length - 1];
    const lastDate = new Date(lastEntry.rawDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set to UTC midnight for date comparison
    lastDate.setUTCHours(0, 0, 0, 0);
    
    // Only add today's point if the last entry is before today
    if (lastDate.getTime() < today.getTime()) {
      const todayISOString = today.toISOString();
      const todayFormatted = formatDate(todayISOString);
      const todayFullDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
      
      validChartData.push({
        date: todayFormatted,
        quantity: lastEntry.quantity, // Use the latest quantity value
        fullDate: todayFullDate,
        rawDate: todayISOString,
      });
    }
  }
  
  console.log("processHistoryData: Chart data result", validChartData);
  console.log("processHistoryData: Data points count", validChartData.length);
  
  return validChartData;
}

export function SubscriptionQuantityChart({ 
  contractId, 
  subscriptionId, 
  fetchSubscriptionQuantityHistory,
  quantitySchedule
}: SubscriptionQuantityChartProps) {
  const [historyData, setHistoryData] = useState<QuantityHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSubscriptionQuantityHistory(contractId, subscriptionId);
        console.log("Subscription quantity history API response:", data);
        
        // The API returns an array of quantity history entries
        let history: QuantityHistoryEntry[] = [];
        
        if (data && data.history && data.history.length > 0) {
          history = data.history;
        } 
        
        // Check if all quantities are 0 - if so, use quantity_schedule as fallback
        const allZero = history.length > 0 && history.every(entry => {
          let qty = 0;
          // Sum all quantities from data array
          if (entry.data && Array.isArray(entry.data) && entry.data.length > 0) {
            qty = entry.data.reduce((sum: number, item: any) => {
              const itemQty = item?.quantity !== undefined ? item.quantity
                : item?.qty !== undefined ? item.qty
                : item?.value !== undefined ? item.value
                : item?.amount !== undefined ? item.amount
                : item?.count !== undefined ? item.count
                : (typeof item === 'number' ? item : 0);
              return sum + itemQty;
            }, 0);
          } else {
            qty = entry.quantity !== undefined ? entry.quantity 
              : entry.qty !== undefined ? entry.qty 
              : entry.value !== undefined ? entry.value
              : entry.amount !== undefined ? entry.amount
              : entry.count !== undefined ? entry.count
              : 0;
          }
          return qty === 0;
        });
        
        // If API returns empty data or all quantities are 0, fall back to quantity_schedule if available
        if ((history.length === 0 || allZero) && quantitySchedule && quantitySchedule.length > 0) {
          console.log("Using quantity_schedule as fallback (API had empty/zero data)");
          console.log("quantity_schedule entries:", quantitySchedule.length, quantitySchedule);
          // Map quantity_schedule to the expected format
          const mappedSchedule = quantitySchedule.map(item => ({
            quantity: item.quantity,
            starting_at: item.starting_at,
          }));
          setHistoryData(mappedSchedule);
        } else if (history.length > 0) {
          console.log("Using API history data:", history.length, "entries");
          setHistoryData(history);
        } else {
          // No API data and no fallback
          console.log("No history data available from API or quantity_schedule");
          setHistoryData([]);
        }
      } catch (err) {
        console.error("Error loading subscription quantity history:", err);
        // On error, use quantity_schedule as fallback if available
        if (quantitySchedule && quantitySchedule.length > 0) {
          console.log("API error, using quantity_schedule as fallback");
          console.log("quantity_schedule entries:", quantitySchedule.length, quantitySchedule);
          // Map quantity_schedule to the expected format
          const mappedSchedule = quantitySchedule.map(item => ({
            quantity: item.quantity,
            starting_at: item.starting_at,
          }));
          setHistoryData(mappedSchedule);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load history");
        }
      } finally {
        setLoading(false);
      }
    };

    if (contractId && subscriptionId) {
      loadHistory();
    } else if (quantitySchedule && quantitySchedule.length > 0) {
      // If no contract/subscription IDs but we have quantity_schedule, use it directly
      console.log("No IDs, using quantity_schedule directly:", quantitySchedule.length, "entries");
      // Map quantity_schedule to the expected format
      const mappedSchedule = quantitySchedule.map(item => ({
        quantity: item.quantity,
        starting_at: item.starting_at,
      }));
      setHistoryData(mappedSchedule);
      setLoading(false);
    }
  }, [contractId, subscriptionId, fetchSubscriptionQuantityHistory, quantitySchedule]);

  const chartData = processHistoryData(historyData);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {data.fullDate}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quantity: <span className="font-semibold text-blue-600 dark:text-blue-400">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-gray-600 dark:text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">No quantity history available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">  
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={chartData.length <= 5 ? 0 : 'preserveStartEnd'}
              angle={chartData.length > 3 ? -45 : 0}
              textAnchor={chartData.length > 3 ? "end" : "middle"}
              height={chartData.length > 3 ? 60 : 30}
            />
            <YAxis 
              stroke="#666"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="quantity" 
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: "#8b5cf6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

