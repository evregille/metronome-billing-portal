"use server";

import Metronome from "@metronome/sdk";

const CUSTOM_SPEND_THRESHOLD_ALERT_NAME = "CUSTOM_SPEND_THRESHOLD_ALERT";
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
  };
  usage: {
    products: Record<string, any>;
    items: Array<any>;
  };
};
type SpendResult = {
  total: number;
  productTotals: Record<string, number>;
};

type InvoiceListBreakdownsResponse = {
  type: string;
  line_items: Array<any>;
  total: number;
  breakdown_start_timestamp: string;
};

/**
 * Helper to initialize Metronome client with default API key if not provided
 */
function getMetronomeClient(api_key: string): InstanceType<typeof Metronome> {
  const token = api_key || process.env.METRONOME_API_TOKEN || "";
  return new Metronome({ bearerToken: token });
}

export async function createMetronomeEmbeddableLink(
  customer_id: string,
  type: DashboardType,
  resolvedTheme?: string,
) {
  try {
    const client = getMetronomeClient(process.env.METRONOME_API_TOKEN || "");

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
): Promise<ApiResponse<BalanceResult>> {
  try {
    const client = getMetronomeClient(process.env.METRONOME_API_TOKEN || "");
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
        product_name: grant.product.name,
        granted,
        used,
        remaining: granted - used,
      };
    });

    return {
      status: "success",
      result: { total_granted, total_used, processed_grants },
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
): Promise<ApiResponse<InvoiceBreakdownResult>> {
  try {
    const client = getMetronomeClient(process.env.METRONOME_API_TOKEN || "");
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

    return {
      status: "success",
      result: {
        costs: retrieveCost(usageData),
        usage: retrieveUsage(usageData),
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchCustomerSpendAlerts(
  customer_id: string,
): Promise<any> {
  try {
    const client = getMetronomeClient(process.env.METRONOME_API_TOKEN || "");
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

export async function createCustomerSpendAlert(
  customer_id: string,
  threshold: number,
): Promise<any> {
  try {
    const client = getMetronomeClient(process.env.METRONOME_API_TOKEN || "");
    await client.v1.alerts.create({
      customer_id: customer_id,
      alert_type: "spend_threshold_reached",
      name: CUSTOM_SPEND_THRESHOLD_ALERT_NAME,
      evaluate_on_create: true,
      threshold: threshold,
    });
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchCurrentSpendDraftInvoice(
  customer_id: string,
): Promise<ApiResponse<SpendResult>> {
  try {
    const client = getMetronomeClient(process.env.METRONOME_API_TOKEN || "");
    const invoices = await client.v1.customers.invoices.list({
      customer_id: customer_id,
      status: "DRAFT",
    });
    let total = 0,
      productTotals: Record<string, number> = {};
    if (invoices?.data) {
      // Calculate total amount from all line items (before commits and credits)
      invoices.data.forEach((inv) => {
        inv.line_items.forEach((item: any) => {
          // Only include positive line items (charges, not credits)
          if (item.total > 0) {
            total += item.total;
            // Normalize product name to group tiers together
            const normalizedName = normalizeProductName(item.name);
            productTotals[normalizedName] =
              (productTotals[normalizedName] || 0) + item.total;
          }
        });
      });
    }
    return { status: "success", result: { total, productTotals } };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const interval = (days: number): any => {
  const now = new Date();
  const now_utc_midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const previous = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previous_utc_midnight = Date.UTC(
    previous.getUTCFullYear(),
    previous.getUTCMonth(),
    previous.getUTCDate(),
  );
  return { start: previous_utc_midnight, end: now_utc_midnight };
};

// Helper function to normalize product names by removing tier suffixes
const normalizeProductName = (productName: string): string => {
  // Remove " - Tier {NUMBER}" suffix from product names
  return productName.replace(/\s*-\s*Tier\s+\d+$/i, '');
};

const retrieveCost = (breakdowns: Array<any>): any => {
  const products: Record<string, any> = {};
  const items: Array<any> = [];

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

      // Initialize product if not exists
      if (!products[normalizedName]) products[normalizedName] = {};

      // Add to product totals
      product_names[normalizedName] =
        (product_names[normalizedName] || 0) + line.total / 100;

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
          line.total / 100,
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
      total: breakdown.total / 100,
      ...dimensions,
      ...product_names,
      starting_on: breakdown.breakdown_start_timestamp,
      type: breakdown.type,
    });
  });
  return { products, items };
};
function retrieveUsage(breakdowns: Array<any>): any {
  const products: Record<string, any> = {};
  const items: Array<any> = [];

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

      // Initialize product if not exists
      if (!products[normalizedName]) products[normalizedName] = {};

      // Add to product totals (using quantity instead of total)
      product_names[normalizedName] =
        (product_names[normalizedName] || 0) + line.quantity;

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
          line.quantity,
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
          line.quantity,
        );
      }
    });

    items.push({
      ...dimensions,
      ...product_names,
      starting_on: breakdown.breakdown_start_timestamp,
      type: breakdown.type,
    });
  });

  return { items, products };
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
