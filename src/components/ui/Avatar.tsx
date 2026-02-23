'use client';
import { cn, getInitials } from '@/lib/utils';

export function Avatar({
  src, name, size = 'md', className,
}: {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center',
      sizeMap[size], className
    )}>
      {getInitials(name || '?')}
    </div>
  );
}
