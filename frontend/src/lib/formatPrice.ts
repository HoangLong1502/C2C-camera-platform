/**
 * Format price to Vietnamese currency format
 * Fixes floating point precision issues
 */
export function formatPrice(price: number | string): string {
  // Convert to number if string
  let numPrice: number;
  if (typeof price === 'string') {
    numPrice = parseFloat(price);
  } else {
    numPrice = price;
  }

  // Handle invalid numbers
  if (isNaN(numPrice) || numPrice < 0) {
    return '0';
  }

  // Round to nearest integer to fix floating point issues
  // e.g., 600000.00 instead of 599999.98
  const roundedPrice = Math.round(numPrice);

  // Format with Vietnamese locale (dots as thousand separators)
  return roundedPrice.toLocaleString('vi-VN');
}
