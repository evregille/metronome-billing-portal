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

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
