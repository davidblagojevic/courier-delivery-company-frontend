/**
 * Formats a number as USD currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$12.34")
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Formats a price per unit (e.g., per kilometer)
 * @param amount - The amount to format
 * @param unit - The unit (e.g., "km", "mile")
 * @returns Formatted currency string with unit (e.g., "$2.50/km")
 */
export const formatPricePerUnit = (amount: number, unit: string): string => {
  return `${formatCurrency(amount)}/${unit}`;
};