import type { Order, OrderItem, Product } from '../types';

export const currency = (value: number, compact = false) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);

export const shortDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(value));

export const today = () => new Date().toISOString().slice(0, 10);

export const orderSubtotal = (items: OrderItem[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.price, 0);

export const orderTotal = (items: OrderItem[], discount: number, gst: number) => {
  const discounted = orderSubtotal(items) * (1 - discount / 100);
  return Math.round(discounted * (1 + gst / 100));
};

export const profitForOrder = (order: Order, products: Product[]) => {
  const cost = order.items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return sum + (product?.purchasePrice ?? 0) * item.quantity;
  }, 0);
  return Math.max(0, order.total - cost);
};

export const csvDownload = (filename: string, rows: Array<Array<string | number>>) => {
  const escape = (cell: string | number) => `"${String(cell).replaceAll('"', '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
