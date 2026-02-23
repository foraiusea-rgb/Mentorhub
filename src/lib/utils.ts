import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
  if (options) {
    return new Date(dateStr).toLocaleString('en-US', options);
  }
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateTime(dateStr: string) {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function generateMeetingLink(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/m/${slug}`;
}

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const EXPERTISE_OPTIONS = [
  'Software Engineering', 'Product Management', 'Data Science', 'Machine Learning',
  'UX Design', 'Marketing', 'Sales', 'Finance', 'Leadership', 'Career Growth',
  'Entrepreneurship', 'Cloud Architecture', 'DevOps', 'Mobile Development',
  'Frontend Development', 'Backend Development', 'System Design', 'Blockchain',
  'Cybersecurity', 'AI/ML', 'Project Management', 'Business Strategy',
];

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'INR', label: '₹ INR' },
  { value: 'AUD', label: 'A$ AUD' },
  { value: 'CAD', label: 'C$ CAD' },
];

export function getDayName(dayIndex: number) {
  return DAYS_OF_WEEK[dayIndex] || '';
}

export function generateShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
