"use server";

import Metronome from "@metronome/sdk/index.mjs";

const CUSTOM_SPEND_THRESHOLD_ALERT_NAME = "CUSTOM_SPEND_THRESHOLD_ALERT";
const CUSTOM_BALANCE_ALERT_NAME = "CUSTOM_BALANCE_ALERT";

const DARK_THEME_COLORS = {
  // Main background colors
  Gray_dark: "#0a0a0a", // Very dark background
  Gray_medium: "#1a1a1a", // Medium dark for cards/sections
  Gray_light: "#2a2a2a", // Lighter gray for borders
  Gray_extralight: "#3a3a3a", // Even lighter for hover states

  // Text colors
  White: "#ffffff", // Primary text color
  Text_primary: "#ffffff", // Primary text
  Text_secondary: "#a1a1aa", // Secondary text (muted)

  // Brand/accent colors
  Primary_medium: "#3b82f6", // Blue primary
  Primary_light: "#60a5fa", // Lighter blue
  Primary_green: "#10b981", // Success/positive green
  Primary_red: "#ef4444", // Error/negative red

  // Chart colors (important for data visualization)
  Chart_1: "#3b82f6", // Blue
  Chart_2: "#10b981", // Green
  Chart_3: "#f59e0b", // Amber
  Chart_4: "#ef4444", // Red
  Chart_5: "#8b5cf6", // Purple
  Chart_6: "#06b6d4", // Cyan

  // Background variants
  Background_primary: "#0a0a0a",
  Background_secondary: "#1a1a1a",
  Background_tertiary: "#2a2a2a",

  // Border colors
  Border_primary: "#3a3a3a",
  Border_secondary: "#4a4a4a",
};

// Types
type DashboardType = "invoices" | "usage" | "commits_and_credits";

type WindowSize = "HOUR" | "DAY" | undefined;
type ApiResponse<T> =
  | { status: "success"; result: T }
  | { status: "error"; message?: string };
type BalanceResult = {
  total_granted: number;
  total_used: number;
  currency_name: string;
  currency_id: string;
  processed_grants: Array<{
    id: string;
    type: string;
    product_name: string;
    granted: number;
    used: number;
    remaining: number;
  }>;
};

type InvoiceBreakdownResult = {
  costs: {
    products: Record<string, any>;
    items: Array<any>;
    currency_name: string;
  };
};

type SpendResult = {
  total: Record<string, number>;
  productTotals: Record<string, { 
    total: number; 
    currency_name: string;
    balanceDrawdown: number;
    overages: number;
    type: string;
  }>;
  commitApplicationTotals: Record<string, { total: number; currency_name: string }>;
};

type InvoiceListBreakdownsResponse = {
  type: string;
  line_items: Array<any>;
  total: number;
  breakdown_start_timestamp: string;
};

type AlertData = {
  id?: string;
  customer_status: string | null;
  alert: {
    id: string;
    type: string;
    name: string;
    threshold?: number;
    enabled?: boolean;
    status?: string;
  };
};

type AlertsResult = {
  balanceAlert: AlertData | null;
  spendAlert: AlertData | null;
};

// Add this type definition near the other types
type InvoiceListItem = {
  start_timestamp: string;
  end_timestamp: string;
  total: number;
  status: string;
};

type InvoiceListResult = {
  invoices: InvoiceListItem[];
};

/**
 * Helper to initialize Metronome client with default API key if not provided
 */
function getMetronomeClient(api_key?: string): InstanceType<typeof Metronome> {
  const token = api_key || process.env.METRONOME_API_TOKEN || "";
  return new Metronome({ bearerToken: token });
}

export async function createMetronomeEmbeddableLink(
  customer_id: string,
  type: DashboardType,
  api_key?: string,
  resolvedTheme?: string,
) {
  try {
    const client = getMetronomeClient(api_key);

    const color_overrides =
      resolvedTheme === "dark"
        ? [
            { name: "Gray_dark" as const, value: DARK_THEME_COLORS.Gray_dark },
            { name: "Gray_medium" as const, value: DARK_THEME_COLORS.Gray_medium },
            { name: "Gray_light" as const, value: DARK_THEME_COLORS.Gray_light },
            { name: "Gray_extralight" as const, value: DARK_THEME_COLORS.Gray_extralight },
            { name: "White" as const, value: DARK_THEME_COLORS.White },
            { name: "Primary_medium" as const, value: DARK_THEME_COLORS.Primary_medium },
            { name: "Primary_light" as const, value: DARK_THEME_COLORS.Primary_light },
            { name: "Primary_green" as const, value: DARK_THEME_COLORS.Primary_green },
            { name: "Primary_red" as const, value: DARK_THEME_COLORS.Primary_red },
          ]
        : undefined;

    const response = await client.v1.dashboards.getEmbeddableURL({
      customer_id: customer_id,
      dashboard: type,
      color_overrides,
    });
    
    return { status: "success", result: response.data.url };
  } catch (error) {
    console.error("Error creating embeddable link:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchMetronomeCustomerBalance(
  customer_id: string,
  api_key?: string,
): Promise<ApiResponse<BalanceResult>> {
  try {
    const client = getMetronomeClient(api_key);
    const response = await client.v1.contracts.listBalances({
      customer_id: customer_id,
      covering_date: new Date().toISOString(),
      include_archived: false,
      include_contract_balances: true,
      include_ledgers: true,
    });

    let total_granted = 0;
    let total_used = 0;
    const processed_grants = response.data.map((grant) => {
      // Calculate total granted for this item
      const granted = grant.access_schedule?.schedule_items
        ? grant.access_schedule.schedule_items.reduce(
            (acc, item) => acc + item.amount,
            0,
          )
        : 0;

      // Calculate total used for this item
      const used = grant.ledger
        ? grant.ledger.reduce(
            (acc, entry) => (entry.amount < 0 ? acc - entry.amount : acc),
            0,
          )
        : 0;

      total_granted += granted;
      total_used += used;

      return {
        id: grant.id,
        type: grant.type,
        product_name: grant.name || grant.product.name,
        granted,
        used,
        remaining: granted - used,
      };
    });

    return {
      status: "success",
      result: { 
        total_granted, 
        total_used, 
        processed_grants, 
        currency_name: response.data[0]?.access_schedule?.credit_type?.name || "USD",
        currency_id: response.data[0]?.access_schedule?.credit_type?.id || "2714e483-4ff1-48e4-9e25-ac732e8f24f2",
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchMetronomeInvoiceBreakdown(
  customer_id: string,
  window_size: WindowSize,
  api_key?: string,
): Promise<ApiResponse<InvoiceBreakdownResult>> {
  try {
    const client = getMetronomeClient(api_key);
    const { start, end } = interval(30);
    let data: InvoiceListBreakdownsResponse[] = [];

    let response = await client.v1.customers.invoices.listBreakdowns({
      customer_id: customer_id,
      window_size,
      starting_on: new Date(start).toISOString(),
      ending_before: new Date(end).toISOString(),
    });

    // Collect all pages of data
    data = [...response.data];
    while (response.next_page) {
      response = await client.v1.customers.invoices.listBreakdowns({
        customer_id: customer_id,
        window_size,
        starting_on: new Date(start).toISOString(),
        ending_before: new Date(end).toISOString(),
        next_page: response.next_page,
      });
      data = [...data, ...response.data];
    }

    const usageData = data.filter((el) => el.type === "USAGE");
    
    const costsData = retrieveCost(usageData);
    
    return {
      status: "success",
      result: {
        costs: costsData,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchCustomerAlerts(
  customer_id: string,
  api_key?: string,
): Promise<ApiResponse<AlertsResult>> {
  try {
    const client = getMetronomeClient(api_key);
    const response = await client.v1.customers.alerts.list({
      customer_id: customer_id,
    });

    // Find balance alert (low_remaining_contract_credit_and_commit_balance_reached)
    const balanceAlert = response.data.find(
      (a) => a.alert.type === "low_remaining_contract_credit_and_commit_balance_reached"
    ) || null;

    // Find spend alert (spend_threshold_reached)
    const spendAlert = response.data.find(
      (a) => a.alert.type === "spend_threshold_reached"
    ) || null;

    return {
      status: "success",
      result: {
        balanceAlert,
        spendAlert,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createCustomerSpendAlert(
  customer_id: string,
  threshold: number,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    const client = getMetronomeClient(api_key);
    const response = await client.v1.alerts.create({
      customer_id: customer_id,
      alert_type: "spend_threshold_reached",
      name: CUSTOM_SPEND_THRESHOLD_ALERT_NAME,
      evaluate_on_create: true,
      threshold: threshold*100,
      credit_type_id: '2714e483-4ff1-48e4-9e25-ac732e8f24f2' // USD
    });
    return { status: "success", result: response.data };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createCustomerBalanceAlert(
  customer_id: string,
  threshold: number,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    const client = getMetronomeClient(api_key);
    const response = await client.v1.alerts.create({
      customer_id: customer_id,
      alert_type: "low_remaining_contract_credit_and_commit_balance_reached",
      name: CUSTOM_BALANCE_ALERT_NAME,
      evaluate_on_create: true,
      threshold: threshold*100,
      credit_type_id: '2714e483-4ff1-48e4-9e25-ac732e8f24f2' // USD
    });
    return { status: "success", result: response.data };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteCustomerAlert(
  alert_id: string,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    const client = getMetronomeClient(api_key);
    await client.v1.alerts.archive({
      id: alert_id,
    });
    return { status: "success", result: null };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Legacy function - keeping for backward compatibility
export async function fetchCustomerSpendAlerts(
  customer_id: string,
  api_key?: string,
): Promise<any> {
  try {
    const client = getMetronomeClient(api_key);
    const response = await client.v1.customers.alerts.list({
      customer_id: customer_id,
    });
    // filter spend alert with name
    return response.data.filter(
      (a) =>
        a.alert.type === "spend_threshold_reached" &&
        a.alert.name === CUSTOM_SPEND_THRESHOLD_ALERT_NAME,
    );
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchCurrentSpendDraftInvoice(
  customer_id: string,
  api_key?: string,
): Promise<ApiResponse<SpendResult>> {
  try {
    const client = getMetronomeClient(api_key);
    const invoices = await client.v1.customers.invoices.list({
      customer_id: customer_id,
      status: "DRAFT",
    });

    const total: Record<string, number> = {};
    const productTotals: Record<string, { 
      total: number; 
      currency_name: string;
      balanceDrawdown: number;
      overages: number;
      type: string;
    }> = {};
    const commitApplicationTotals: Record<string, { total: number; currency_name: string }> = {};
    if (invoices?.data) {
      // Calculate total amount from all line items (before commits and credits)
      invoices.data.forEach((inv) => {
        
        inv.line_items.forEach((item: any) => {
          const currency_name = item.credit_type.name;
          // Only include positive line items (charges, not credits)
          if (item.total > 0) {
            // Add to currency-specific total
            total[currency_name] = (total[currency_name] || 0) + item.total;
            // Normalize product name to group tiers together
            const normalizedName = normalizeProductName(item.name);
            const hasCommitApplied = item.applied_commit_or_credit && item.applied_commit_or_credit.id;
            if(item.type !== `cpu_conversion`){
              if (productTotals[normalizedName]) {
                productTotals[normalizedName].total += item.total;
                productTotals[normalizedName].type = item.type;
                if (hasCommitApplied) {
                  productTotals[normalizedName].balanceDrawdown += item.total;
                } else {
                  productTotals[normalizedName].overages += item.total;
                }
              } else {
                productTotals[normalizedName] = {
                  total: item.total,
                  currency_name: item.credit_type.name, // Use line item's specific currency
                  balanceDrawdown: hasCommitApplied ? item.total : 0,
                  overages: hasCommitApplied ? 0 : item.total,
                  type: item.type
                };
              }
            }
            
            // Add to commit application breakdown
            const commitStatus = hasCommitApplied ? "Balance Drawdown" : "Overages";
            if (commitStatus === "Overages" && item.type === `cpu_conversion` || commitStatus === "Balance Drawdown") {
              if (commitApplicationTotals[commitStatus]) {
                commitApplicationTotals[commitStatus].total += item.total;
              } else {
                commitApplicationTotals[commitStatus] = {
                  total: item.total,
                  currency_name: currency_name
                };
              }
            }
          }
          
        });
      });
    }
    
    return { 
      status: "success", 
      result: { 
        total, 
        productTotals, 
        commitApplicationTotals 
      } 
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchCustomerInvoices(
  customer_id: string,
  api_key?: string,
): Promise<ApiResponse<InvoiceListResult>> {
  try {
    const client = getMetronomeClient(api_key);
    const response = await client.v1.customers.invoices.list({
      customer_id: customer_id,
    });

    const invoices: InvoiceListItem[] = response.data.map((invoice: any) => ({
      start_timestamp: invoice.start_timestamp,
      end_timestamp: invoice.end_timestamp,
      total: invoice.total,
      status: invoice.status,
    }));

    return {
      status: "success",
      result: { invoices },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchMetronomeCustomers(
  api_key?: string,
): Promise<ApiResponse<any[]>> {
  try {
    const client = getMetronomeClient(api_key);

    let response = await client.v1.customers.list();
    let data = [...response.data];
    while (response.next_page) {
      response = await client.v1.customers.list({
        next_page: response.next_page,
      });
      data = [...data, ...response.data];
    }
    return { status: "success", result: data };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const interval = (days: number): any => {
  const now = new Date();
  // Round current time to next day's UTC midnight
  const nextDay = new Date(now);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1); // Add one day
  const now_utc_next_midnight = Date.UTC(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth(),
    nextDay.getUTCDate(),
    0, // 0 hours (midnight)
    0, // 0 minutes
    0, // 0 seconds
    0  // 0 milliseconds
  );
  
  const previous = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previous_utc_midnight = Date.UTC(
    previous.getUTCFullYear(),
    previous.getUTCMonth(),
    previous.getUTCDate(),
  );
  return { start: previous_utc_midnight, end: now_utc_next_midnight };
};

// Helper function to normalize product names by removing tier suffixes
const normalizeProductName = (productName: string): string => {
  // Remove " - Tier {NUMBER}" suffix from product names
  return productName.replace(/\s*-\s*Tier\s+\d+$/i, '');
};

const retrieveCost = (breakdowns: Array<any>): any => {
  const products: Record<string, any> = {};
  const items: Array<any> = [];
  let currency_name : string = "";

  breakdowns.forEach((breakdown) => {
    if (!breakdown.line_items) return;

    const dimensions: Record<string, number> = {};
    const product_names: Record<string, number> = {};

    breakdown.line_items.forEach((line: any) => {
      // Skip non-usage products and credits
      
      if (line.total < 0 || line.product_type !== "UsageProductListItem")
        return;
      // Normalize product name to group tiers together
      const normalizedName = normalizeProductName(line.name);
      currency_name = line.credit_type.name;

      // Initialize product if not exists
      if (!products[normalizedName]) products[normalizedName] = {};

      // Add to product totals
      product_names[normalizedName] =
        (product_names[normalizedName] || 0) + line.total ;

      // Process pricing group values
      if (
        line.pricing_group_values &&
        Object.keys(line.pricing_group_values).length > 0
      ) {
        processGroupValues(
          line.pricing_group_values,
          dimensions,
          products,
          normalizedName,
          line.total ,
        );
      }

      // Process presentation group values
      if (
        line.presentation_group_values &&
        Object.keys(line.presentation_group_values).length > 0
      ) {
        processGroupValues(
          line.presentation_group_values,
          dimensions,
          products,
          normalizedName,
          line.total,
        );
      }
    });

    items.push({
      total: breakdown.total ,
      ...dimensions,
      ...product_names,
      starting_on: breakdown.breakdown_start_timestamp,
      type: breakdown.type,
      line_items: breakdown.line_items, // Add line_items to preserve original data
    });
  });
  return { 
    products, 
    items , 
    currency_name, // TODO : add support for multiple currencies
  };
}

function processGroupValues(
  groupValues: Record<string, string>,
  dimensions: Record<string, number>,
  products: Record<string, any>,
  productName: string,
  value: number,
): void {
  Object.entries(groupValues).forEach(([key, groupValue]) => {
    if (!groupValue) return;

    // Add to dimensions total
    dimensions[groupValue] = (dimensions[groupValue] || 0) + value;

    // Update products structure
    if (!products[productName][key]) {
      products[productName][key] = [groupValue];
    } else if (!products[productName][key].includes(groupValue)) {
      products[productName][key].push(groupValue);
    }
  });
}

export async function fetchRawUsageData(customer_id: string, api_key?: string): Promise<ApiResponse<any>> {  
  try {
    const client = getMetronomeClient(api_key);
    const { start, end } = interval(30);
    // First, get all billable metrics for the customer
    const billableMetricsResponse = await client.v1.customers.listBillableMetrics({
      customer_id: customer_id,
    });
    
    const billableMetrics = billableMetricsResponse.data;
    const usageResults = [];
    
    // For each billable metric, fetch its usage data
    for (const metric of billableMetrics) {
      try {
        const usageResponse = await client.v1.usage.listWithGroups({
          customer_id: customer_id,
          billable_metric_id: metric.id,
          window_size: "DAY",
          starting_on: new Date(start).toISOString(),
          ending_before: new Date(end).toISOString(),
        });
        
        // Calculate aggregated value (sum of all usage entries)
        const aggregatedValue = usageResponse.data.reduce((sum, entry) => {
          return sum + (entry.value || 0);
        }, 0);
        
        usageResults.push({
          billable_metric: {
            id: metric.id,
            name: metric.name,
          },
          raw_usage_data: usageResponse.data,
          aggregated_value: aggregatedValue,
          total_entries: usageResponse.data.length,
        });
        
      } catch (metricError) {
        // Continue with other metrics even if one fails
        usageResults.push({
          billable_metric: {
            id: metric.id,
            name: metric.name
          },
          raw_usage_data: [],
          aggregated_value: 0,
          total_entries: 0,
          error: metricError instanceof Error ? metricError.message : "Unknown error",
        });
      }
    }
    return { 
      status: "success", 
      result: {
        customer_id,
        total_metrics: billableMetrics.length,
        usage_data: usageResults,
      }
    };
  } catch (error) {
    return { 
      status: "error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function fetchBillableMetric(
  billable_metric_id: string,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    const client = getMetronomeClient(api_key);
    const response = await client.v1.billableMetrics.retrieve({
      billable_metric_id: billable_metric_id,
    });

    return {
      status: "success",
      result: response.data,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendUsageData(
  customer_id: string,
  event_type: string,
  properties: Record<string, any>,
  timestamp: string,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    const client = getMetronomeClient(api_key);
    
    // Prepare the usage data payload - the ingest function expects an array of usage objects
    const usagePayload = {
      customer_id: customer_id,
      event_type:event_type,
      transaction_id: `txn_${Date.now()}`, // Required field - generate unique transaction ID
      timestamp: timestamp || new Date().toISOString(),
      properties: properties || {},
    };
    
    await client.v1.usage.ingest([usagePayload]);
    
    return {
      status: "success",
      result: { message: "Usage data sent successfully", usage: usagePayload },
    };
  } catch (error) {
    console.error("Error sending usage data:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred while sending usage data",
    };
  }
}

export async function rechargeBalance(
  customer_id: string,
  recharge_amount: number,
  currency_id: string,
  recharge_product_id: string,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    
    
    const client = getMetronomeClient(api_key);
    
    // First, fetch the list of contracts for the customer
    const contractsResponse = await client.v2.contracts.list({
      customer_id: customer_id,
    });
    
    
    // Find a contract with Stripe billing configuration
    const contractWithStripe = contractsResponse.data.find((contract: any) => {
      return contract.customer_billing_provider_configuration && 
             contract.customer_billing_provider_configuration.billing_provider === 'stripe';
    });
    
    if (!contractWithStripe) {
      return {
        status: "error",
        message: "No contract found with Stripe billing configuration for this customer",
      };
    }
  
    
    // Calculate dates for the commit (rounded to the hour)
    const now = new Date();
    now.setMinutes(0, 0, 0); // Round to the current hour
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    oneYearFromNow.setMinutes(0, 0, 0); // Round to the hour
    
    // Create the recharge commit payload
    const rechargePayload = {
      customer_id: customer_id,
      contract_id: contractWithStripe.id,
      add_commits: [
        {
          product_id: recharge_product_id,
          type: "PREPAID" as const, 
          name: "Recharge",
          access_schedule: {
            credit_type_id: currency_id,
            schedule_items: [
              {
                amount: recharge_amount,
                ending_before: oneYearFromNow.toISOString(),
                starting_at: now.toISOString(),
              }
            ]
          },
          invoice_schedule: {
            schedule_items: [
              {
                amount: recharge_amount,
                timestamp: now.toISOString(),
              }
            ]
          },
          priority: 10,
          payment_gate_config: {
            payment_gate_type: "STRIPE" as const,
            stripe_config: {
              payment_type: "INVOICE" as const,
            }
          }
        }
      ]
    };
    
    // Edit the contract to add the commit
    const editResponse = await client.v2.contracts.edit(rechargePayload);
    
    return {
      status: "success",
      result: {
        contract_id: contractWithStripe.id,
        recharge_amount: recharge_amount,
        commit_data: editResponse.data,
      },
    };
  } catch (error) {
    console.error("Error recharging balance:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred while recharging balance",
    };
  }
}

export async function previewEvents(
  customer_id: string,
  events: Array<{
    event_type: string;
    timestamp?: string;
    properties?: Record<string, any>;
  }>,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    const client = getMetronomeClient(api_key);
    
    // Call the Metronome SDK previewEvents function
    const previewResponse = await client.v1.customers.previewEvents({
      customer_id: customer_id,
      events: events
    });
    
    return {
      status: "success",
      result: previewResponse,
    };
  } catch (error) {
    console.error("Error previewing events:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred while previewing events",
    };
  }
}

export async function fetchContractSubscriptions(
  customer_id: string,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    const client = getMetronomeClient(api_key);
    
    // Call the Metronome SDK v2 contracts list function
    const response = await client.v2.contracts.list({
      customer_id: customer_id,
    });
    
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const activeContracts = response.data.filter((contract: any) => {
      // If no ending_before date, contract is active
      if (!contract.ending_before) {
        return true;
      }
      // If ending_before exists, check if it's after today
      const endingDate = new Date(contract.ending_before);
      return endingDate > today;
    });
    
    if (activeContracts.length === 0) {
      return {
        status: "success",
        result: {
          contract_id: null,
          subscriptions: [],
        },
      };
    }
    return {
      status: "success",
      result: {
        contract_id: activeContracts[0].id,
        subscriptions: activeContracts[0].subscriptions || [],
      },
    };
  } catch (error) {
    console.error("Error fetching contract subscriptions:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred while fetching contract subscriptions",
    };
  }
}

export async function updateSubscriptionQuantity(
  customer_id: string,
  contract_id: string,
  subscription_id: string,
  new_quantity: number,
  api_key?: string,
): Promise<ApiResponse<any>> {
  try {
    const client = getMetronomeClient(api_key);
    
    // Calculate midnight-aligned date for starting_at
    const now = new Date();
    const midnightAligned = new Date(now);
    midnightAligned.setUTCHours(0, 0, 0, 0);
    
    // If the current time is past midnight, use next midnight
    if (now.getTime() > midnightAligned.getTime()) {
      midnightAligned.setUTCDate(midnightAligned.getUTCDate() + 1);
    }
    
    const updatePayload = {
      customer_id: customer_id,
      contract_id: contract_id,
      update_subscriptions: [
        {
          subscription_id: subscription_id,
          quantity_updates: [
            {
              starting_at: midnightAligned.toISOString(),
              quantity: new_quantity,
            },
          ],
        },
      ],
    };
    
    const response = await client.v2.contracts.edit(updatePayload);
    
    return {
      status: "success",
      result: response.data,
    };
  } catch (error) {
    console.error("Error updating subscription quantity:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred while updating subscription quantity",
    };
  }
}