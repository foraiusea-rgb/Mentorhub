'use client';

import React, { forwardRef, useState } from 'react';
import { cn, getInitials } from '@/lib/utils';
import { X } from 'lucide-react';

// ---- BUTTON ----
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
    const variants = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md',
      secondary: 'bg-surface-100 text-surface-800 hover:bg-surface-200 border border-surface-200',
      ghost: 'text-surface-600 hover:text-surface-800 hover:bg-surface-100',
      danger: 'bg-accent-rose text-white hover:bg-red-600 shadow-sm',
      outline: 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ---- INPUT ----
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">{icon}</div>}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-surface-900 placeholder:text-surface-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
            'hover:border-surface-300',
            icon && 'pl-10',
            error && 'border-accent-rose focus:ring-accent-rose/30 focus:border-accent-rose',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-accent-rose">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ---- TEXTAREA ----
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-surface-900 placeholder:text-surface-400 transition-all duration-200 resize-y min-h-[100px]',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
          error && 'border-accent-rose',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-accent-rose">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

// ---- SELECT ----
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-surface-900 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-accent-rose">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

// ---- BADGE ----
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-surface-100 text-surface-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-brand-50 text-brand-700 border-brand-200',
    premium: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-200',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
}

// ---- AVATAR ----
interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        className={cn('rounded-full object-cover ring-2 ring-white', sizes[size], className)}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold bg-gradient-to-br from-brand-400 to-brand-600 text-white ring-2 ring-white',
      sizes[size], className
    )}>
      {getInitials(name)}
    </div>
  );
}

// ---- CARD ----
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-surface-100 shadow-card p-6',
        hover && 'hover:shadow-card-hover hover:border-surface-200 transition-all duration-300 cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

// ---- MODAL ----
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-xl w-full p-6 animate-slide-up', sizes[size])}>
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-surface-900">{title}</h3>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors ml-auto">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---- SPINNER ----
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}

// ---- EMPTY STATE ----
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-surface-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-surface-800 mb-1">{title}</h3>
      {description && <p className="text-surface-500 mb-6 max-w-md">{description}</p>}
      {action}
    </div>
  );
}

// ---- TOGGLE ----
export function Toggle({ checked, onChange, label }: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-brand-600' : 'bg-surface-200'
        )}
      >
        <div className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
          checked && 'translate-x-5'
        )} />
      </div>
      {label && <span className="text-sm text-surface-700">{label}</span>}
    </label>
  );
}

// ---- STAR RATING ----
export function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={star <= rating ? 'text-amber-400' : 'text-surface-200'}
          width={size}
          height={size}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ---- SKELETON ----
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-100 rounded-xl', className)} />;
}
