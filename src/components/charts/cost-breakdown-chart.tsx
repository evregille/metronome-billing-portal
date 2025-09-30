"use client";

import { useEffect, useState, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMetronome } from "@/hooks/use-metronome-config";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, ChevronDown, Loader2 } from "lucide-react";

interface ProductFilter {
  name: string;
  properties: string[];
}

interface DimensionData {
  name: string;
  value: number;
  color: string;
}

// Simple function to normalize product names (remove tier suffixes)
const normalizeProductName = (productName: string): string => {
  return productName.replace(/\s*-\s*Tier\s+\d+$/i, '');
};

export function CostBreakdownChart() {
  const { costs, fetchCosts, loadingStates, isCustomerTransitioning } = useMetronome();
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [availableProducts, setAvailableProducts] = useState<ProductFilter[]>([]);
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<DimensionData[]>([]);

  // Define colors for different dimensions
  const dimensionColors = useMemo(() => [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#6366f1', // Indigo
  ], []);

  useEffect(() => {
    (async () => {
      await fetchCosts();
    })();
  }, [fetchCosts]);

  // Process available products and properties from costs data
  useEffect(() => {
    if (costs?.products) {
      const products: ProductFilter[] = Object.entries(costs.products).map(([name, properties]) => ({
        name,
        properties: Object.keys(properties as Record<string, any>)
      }));
      
      // Add "All Products" option at the beginning
      const allProductsOption: ProductFilter = {
        name: "All Products",
        properties: []
      };
      
      setAvailableProducts([allProductsOption, ...products]);
      
      // Reset selections when costs data changes (e.g., customer change)
      // Set default selection to "All Products" if none selected
      setSelectedProduct("All Products");
      setSelectedProperty("");
    }
  }, [costs]);

  // Update available properties when product changes
  useEffect(() => {
    if (selectedProduct && costs?.products) {
      if (selectedProduct === "All Products") {
        // For "All Products", hide the property filter
        setAvailableProperties([]);
        setSelectedProperty("");
      } else {
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
    }
  }, [selectedProduct, costs, selectedProperty]);

  // Extract dimensions when property is selected (only for specific products)
  useEffect(() => {
    if (selectedProduct && selectedProduct !== "All Products" && selectedProperty && costs?.products) {
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
    } else if (selectedProduct === "All Products") {
      // For "All Products", create dimensions based on product names
      const productNames = Object.keys(costs?.products || {});
      const dimensionData: DimensionData[] = productNames.map((productName, index) => ({
        name: productName,
        value: 0, // Will be calculated from items
        color: dimensionColors[index % dimensionColors.length]
      }));
      setDimensions(dimensionData);
    }
  }, [selectedProduct, selectedProperty, costs, dimensionColors]);

  // Process chart data based on selected filters
  useEffect(() => {
    if (costs?.items && selectedProduct && dimensions.length > 0) {
      const data = costs.items.map((item: any) => {
        const chartItem: any = {
          date: new Date(item.starting_on).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC"
          }),
          fullDate: item.starting_on,
          rawData: item
        };

        if (selectedProduct === "All Products") {
          // For "All Products", show breakdown by product names
          dimensions.forEach((dimension) => {
            chartItem[dimension.name] = item[dimension.name] || 0;
          });
        } else {
          // For specific product, filter line items and aggregate by dimensions
          dimensions.forEach((dimension) => {
            // Filter line items for the selected product and aggregate by dimension
            const filteredLineItems = item.line_items?.filter((lineItem: any) => 
              lineItem.product_type === "UsageProductListItem" && 
              lineItem.total >= 0 &&
              normalizeProductName(lineItem.name) === selectedProduct
            ) || [];
            
            // Aggregate by the selected property (dimension)
            const dimensionTotal = filteredLineItems.reduce((sum: number, lineItem: any) => {
              // Check if the line item matches the dimension value
              if (selectedProperty) {
                const groupValues = lineItem.pricing_group_values || lineItem.presentation_group_values || {};
                if (groupValues[selectedProperty] === dimension.name) {
                  return sum + lineItem.total; // Remove /100 since formatCurrency handles the conversion
                }
              }
              return sum;
            }, 0);
            
            chartItem[dimension.name] = dimensionTotal;
          });
        }

        // Calculate total for this item
        chartItem.total = dimensions.reduce((sum, dim) => sum + (chartItem[dim.name] || 0), 0);
        
        return chartItem;
      });
      
      setChartData(data);
    } else {
      setChartData([]);
    }
  }, [costs, selectedProduct, selectedProperty, dimensions]);

  const handleProductChange = (productName: string) => {
    setSelectedProduct(productName);
    setSelectedProperty(""); // Reset property when product changes
  };

  const handlePropertyChange = (propertyName: string) => {
    setSelectedProperty(propertyName);
  };

  // Show loading state during customer transition
  if (isCustomerTransitioning) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Costs Breakdown</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Daily spending trends</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Loading customer data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingStates.costs) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cost Breakdown</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading cost data...</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (Object.keys(costs?.products || {}).length === 0) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cost Breakdown</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">No cost data available</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Cost Data Available</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No cost breakdown data found for the selected period.
          </p>
        </div>
      </div>
    );
  }

  if (!availableProducts.length || availableProducts.length === 1) {
    return (
      <div className="glass-card card-hover rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Costs Breakdown</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Daily spending trends</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Cost Data Available</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No cost breakdown data found for the selected period.
          </p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cost Breakdown</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedProduct === "All Products"
                ? 'Breakdown by Product'
                : selectedProduct && selectedProperty 
                  ? `${selectedProduct} by ${selectedProperty.replace(/_/g, ' ')}`
                  : 'Daily spending trends'
              }
            </p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-6">
          
          {/* Product Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Filter by Product</label>
            <div className="relative">
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {availableProducts.map((product) => (
                  <option key={product.name} value={product.name}>
                    {product.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Property Filter - Only show for specific products */}
          {selectedProduct !== "All Products" && availableProperties.length > 0 && (
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Group by</label>
              <div className="relative">
                <select
                  value={selectedProperty}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {availableProperties.map((property) => (
                    <option key={property} value={property}>
                      {property.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
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
              tickFormatter={(value) => `${formatCurrency(value.toFixed(0), costs?.currency_name)}`}
            />
            <Tooltip
              formatter={(value, name) => [
                `${formatCurrency(Number(value), costs?.currency_name)}`, 
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
    </div>
  );
}
