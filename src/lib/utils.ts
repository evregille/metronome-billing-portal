import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const COIN_SYMBOLS = {
  "USD (cents)": "$",
  "USD": "$",
  "EUR": "€",
  "GBP": "£",
  "JPY": "¥",
  "KRW": "₩",
  "CAD": "$",
  "AUD": "$",
  "NZD": "$",
  "CHF": "₣",
  "SEK": "kr",
  "NOK": "kr",
  "DKK": "kr",
  "SGD": "$",
  "HKD": "$",
  "MXN": "$",
  "BRL": "R$",
  "INR": "₹",
  "CNY": "¥",
  "ZAR": "R",
  "RUB": "₽",
};

export function getCoinSymbol(currency_name: string): string {
  return COIN_SYMBOLS[currency_name as keyof typeof COIN_SYMBOLS] || currency_name;
}

const divideBy100 = (currency: string): boolean => {
  return currency  === "USD (cents)";
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency_name: string = ""): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = COIN_SYMBOLS[currency_name as keyof typeof COIN_SYMBOLS] || undefined;

  if (isNaN(numericAmount)) return (symbol) ? `${symbol}0.00` : `0.00 ${currency_name}`;
  
  const value = (divideBy100(currency_name) ? (numericAmount / 100) : numericAmount)
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (symbol) ? `${symbol}${value}` : `${value} ${currency_name}`;
}

/**
 * Formats a date for display in UTC timezone (to match Metronome)
 * @param input - Date string (ISO format from Metronome/UTC) or timestamp
 * @returns Formatted date string in UTC timezone
 */
export function formatDate(input: string | number): string {
  if (!input) return '';
  
  // Ensure the date is parsed correctly
  // If it's already an ISO string with time, use it directly
  // If it's just a date string, ensure it's treated as UTC
  let date: Date;
  if (typeof input === 'string') {
    // If it's an ISO string (contains T and Z), parse directly
    if (input.includes('T') || input.includes('Z')) {
      date = new Date(input);
    } else {
      // If it's just a date string (YYYY-MM-DD), treat as UTC midnight
      date = new Date(input + 'T00:00:00Z');
    }
  } else {
    date = new Date(input);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', input);
    return '';
  }
  
  // Format in UTC timezone to match Metronome
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

/**
 * Converts a date string (YYYY-MM-DD) selected by user to UTC midnight ISO string
 * The date is interpreted as UTC - e.g., "2025-11-15" becomes "2025-11-15T00:00:00.000Z"
 * Used when sending dates to Metronome API
 * @param dateString - Date string in YYYY-MM-DD format (interpreted as UTC)
 * @returns ISO string in UTC (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
export function localDateToUTC(dateString: string): string {
  if (!dateString) return '';
  
  // Interpret the date as UTC midnight directly
  // User selects "2025-11-15" (in UTC) -> we send "2025-11-15T00:00:00.000Z" to Metronome
  return `${dateString}T00:00:00.000Z`;
}

/**
 * Converts a UTC ISO string to UTC date string (YYYY-MM-DD)
 * Used when displaying dates from Metronome API in date inputs
 * @param utcIsoString - ISO string in UTC
 * @returns Date string in YYYY-MM-DD format (UTC)
 */
export function utcToLocalDate(utcIsoString: string): string {
  if (!utcIsoString) return '';
  
  const date = new Date(utcIsoString);
  
  // Get UTC date components (to match Metronome)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function nFormatter(num: number, digits?: number) {
  if (!num) return "0";
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, "$1") + item.symbol
    : "0";
}
