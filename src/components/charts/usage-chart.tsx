"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface UsageDataEntry {
  timestamp: string;
  value: number;
  [key: string]: any;
}

interface UsageChartProps {
  data: UsageDataEntry[];
  metricName: string;
  totalValue: number;
  color?: string;
}

// Helper function to fill missing days with 0 values
function fillMissingDays(data: Array<{date: string, value: number, fullDate: string}>) {
  if (data.length === 0) return data;
  
  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  
  // Get date range
  const startDate = new Date(sortedData[0].fullDate);
  const endDate = new Date(sortedData[sortedData.length - 1].fullDate);
  
  // Create a map of existing dates
  const dateMap = new Map();
  sortedData.forEach(entry => {
    const dateKey = new Date(entry.fullDate).toDateString();
    dateMap.set(dateKey, entry);
  });
  
  // Fill in missing days
  const filledData = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateKey = currentDate.toDateString();
    const existingEntry = dateMap.get(dateKey);
    
    if (existingEntry) {
      filledData.push(existingEntry);
    } else {
      // Add missing day with 0 value
      filledData.push({
        date: currentDate.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric",
          timeZone: "UTC"
        }),
        value: 0,
        fullDate: currentDate.toISOString(),
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return filledData;
}

export function UsageChart({ data, metricName, totalValue, color = "#3b82f6" }: UsageChartProps) {
  // Transform data for the chart with better date handling
  const chartData = data.map(entry => {
    let dateStr = "Invalid Date";
    let timestamp = entry.timestamp;
    
    // Try different possible timestamp field names
    if (!timestamp) {
      timestamp = entry.date || entry.starting_on || entry.ending_before || entry.time;
    }
    
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        dateStr = date.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric",
          timeZone: "UTC"
        });
      }
    } catch (error) {
      console.warn("Invalid timestamp:", timestamp, "for entry:", entry, error);
    }
    
    return {
      date: dateStr,
      value: entry.value || entry.quantity || 0, // Default to 0 if no value
      fullDate: timestamp,
    };
  }).filter(entry => entry.date !== "Invalid Date"); // Filter out invalid dates

  // Fill in missing days with 0 values
  const filledChartData = fillMissingDays(chartData);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Value: <span className="font-semibold" style={{ color }}>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900">{metricName}</h4>
        <p className="text-sm text-gray-600">
          Total: <span className="font-semibold text-lg" style={{ color }}>{totalValue.toLocaleString()}</span>
        </p>
      </div>
      
      {filledChartData.length > 0 ? (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filledChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500 text-sm">No valid date data available</p>
            <p className="text-gray-400 text-xs mt-1">
              {data.length > 0 ? `${data.length} entries with invalid timestamps` : 'No data entries'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
