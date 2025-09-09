"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMetronome } from "@/hooks/use-metronome-config";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, Filter, ChevronDown } from "lucide-react";

interface ProductFilter {
  name: string;
  properties: string[];
}

interface DimensionData {
  name: string;
  value: number;
  color: string;
}

export function CostBreakdownChart() {
  const { costs, fetchCosts, loadingStates } = useMetronome();
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [availableProducts, setAvailableProducts] = useState<ProductFilter[]>([]);
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<DimensionData[]>([]);

  // Define colors for different dimensions
  const dimensionColors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#6366f1', // Indigo
  ];

  useEffect(() => {
    (async () => {
      await fetchCosts();
    })();
  }, [fetchCosts]);

  // Reset filter selections when costs data changes (e.g., customer change)
  useEffect(() => {
    if (costs?.products) {
      // Reset selections when costs data changes
      setSelectedProduct("");
      setSelectedProperty("");
    }
  }, [costs]);

  // Process available products and properties from costs data
  useEffect(() => {
    if (costs?.products) {
      const products: ProductFilter[] = Object.entries(costs.products).map(([name, properties]) => ({
        name,
        properties: Object.keys(properties as Record<string, any>)
      }));
      setAvailableProducts(products);
      
      // Set default selection to first product if none selected
      if (products.length > 0 && !selectedProduct) {
        setSelectedProduct(products[0].name);
      }
    }
  }, [costs, selectedProduct]);

  // Update available properties when product changes
  useEffect(() => {
    if (selectedProduct && costs?.products) {
      const product = costs.products[selectedProduct];
      if (product) {
        const properties = Object.keys(product);
        setAvailableProperties(properties);
        
        // Set default property to first one if none selected
        if (properties.length > 0 && !selectedProperty) {
          setSelectedProperty(properties[0]);
        }
      }
    }
  }, [selectedProduct, costs, selectedProperty]);

  // Extract dimensions when property is selected
  useEffect(() => {
    if (selectedProduct && selectedProperty && costs?.products) {
      const product = costs.products[selectedProduct];
      if (product && product[selectedProperty]) {
        const dimensionValues = product[selectedProperty];
        const dimensionData: DimensionData[] = dimensionValues.map((value: string, index: number) => ({
          name: value,
          value: 0, // Will be calculated from items
          color: dimensionColors[index % dimensionColors.length]
        }));
        setDimensions(dimensionData);
      }
    }
  }, [selectedProduct, selectedProperty, costs]);

  // Process chart data based on selected filters
  useEffect(() => {
    console.log("Cost breakdown - costs data:", costs);
    console.log("Cost breakdown - costs.items:", costs?.items);
    console.log("Cost breakdown - selected filters:", { selectedProduct, selectedProperty });
    console.log("Cost breakdown - dimensions:", dimensions);
    
    if (costs?.items && selectedProduct && selectedProperty && dimensions.length > 0) {
      const data = costs.items.map((item: any) => {
        const chartItem: any = {
          date: new Date(item.starting_on).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: item.starting_on,
          rawData: item
        };

        // Add values for each dimension
        dimensions.forEach((dimension) => {
          chartItem[dimension.name] = item[dimension.name] || 0;
        });

        // Calculate total for this item
        chartItem.total = dimensions.reduce((sum, dim) => sum + (item[dim.name] || 0), 0);
        
        return chartItem;
      });
      
      console.log("Cost breakdown - processed chart data:", data);
      setChartData(data);
    } else {
      console.log("Cost breakdown - no items found or filters not selected");
      setChartData([]);
    }
  }, [costs, selectedProduct, selectedProperty, dimensions]);

  const totalSpend = chartData.reduce((sum, item) => sum + item.total, 0);
  const avgDailySpend = chartData.length > 0 ? totalSpend / chartData.length : 0;

  const handleProductChange = (productName: string) => {
    setSelectedProduct(productName);
    setSelectedProperty(""); // Reset property when product changes
  };

  const handlePropertyChange = (propertyName: string) => {
    setSelectedProperty(propertyName);
  };

  if (loadingStates.costs) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
            <p className="text-sm text-gray-600">Loading cost data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!availableProducts.length) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
            <p className="text-sm text-gray-600">Daily spending trends</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Cost Data Available</h4>
          <p className="text-gray-600 mb-4">
            No cost breakdown data found for the selected period.
          </p>
          <div className="text-sm text-gray-500">
            <p>Debug info:</p>
            <p>Costs object: {JSON.stringify(costs, null, 2)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
            <p className="text-sm text-gray-600">
              {selectedProduct && selectedProperty 
                ? `${selectedProduct} by ${selectedProperty.replace(/_/g, ' ')}`
                : 'Daily spending trends'
              }
            </p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-gray-500" />
          
          {/* Product Filter */}
          <div className="relative">
            <select
              value={selectedProduct}
              onChange={(e) => handleProductChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {availableProducts.map((product) => (
                <option key={product.name} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Property Filter */}
          {availableProperties.length > 0 && (
            <div className="relative">
              <select
                value={selectedProperty}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {availableProperties.map((property) => (
                  <option key={property} value={property}>
                    {property.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              formatter={(value, name) => [
                `$${formatCurrency(Number(value))}`, 
                name
              ]}
              labelFormatter={(value) => `Date: ${value}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            
            {/* Render bars for each dimension */}
            {dimensions.map((dimension, index) => (
              <Bar
                key={dimension.name}
                dataKey={dimension.name}
                stackId="a"
                fill={dimension.color}
                radius={index === dimensions.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalSpend)}
          </div>
          <div className="text-sm text-gray-600">
            Total {selectedProduct || 'Spend'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(avgDailySpend)}
          </div>
          <div className="text-sm text-gray-600">Avg Daily</div>
        </div>
      </div>

      {/* Dimension Breakdown */}
      {dimensions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Breakdown by {selectedProperty?.replace(/_/g, ' ')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {dimensions.map((dimension) => {
              const dimensionTotal = chartData.reduce((sum, item) => sum + (item[dimension.name] || 0), 0);
              const percentage = totalSpend > 0 ? (dimensionTotal / totalSpend) * 100 : 0;
              
              return (
                <div key={dimension.name} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: dimension.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {dimension.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatCurrency(dimensionTotal)} ({percentage.toFixed(1)}%)
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
