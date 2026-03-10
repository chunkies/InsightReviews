import type { Review } from '@/lib/types/database';
import { format } from 'date-fns';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateReviewsCsv(reviews: Review[]): string {
  const headers = ['Date', 'Customer Name', 'Rating', 'Sentiment', 'Comment', 'Public'];
  const rows = reviews.map((review) => [
    format(new Date(review.created_at), 'dd/MM/yyyy'),
    review.customer_name || '',
    String(review.rating),
    review.is_positive ? 'Positive' : 'Negative',
    review.comment || '',
    review.is_public ? 'Yes' : 'No',
  ]);

  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ];

  return csvLines.join('\n');
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
