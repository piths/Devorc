import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 80, height: 80 },
};

const horizontalSizeMap = {
  sm: { width: 120, height: 32 },
  md: { width: 180, height: 48 },
  lg: { width: 240, height: 64 },
  xl: { width: 300, height: 80 },
};

export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  const dimensions = variant === 'horizontal' ? horizontalSizeMap[size] : sizeMap[size];
  
  const logoSrc = {
    full: '/logo.svg',
    icon: '/logo-icon.svg',
    horizontal: '/logo-horizontal.svg',
  }[variant];

  return (
    <Image
      src={logoSrc}
      alt="Devorc Suite"
      width={dimensions.width}
      height={dimensions.height}
      className={cn('object-contain', className)}
      priority
    />
  );
}

export function LogoText({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Logo variant="icon" size="sm" />
      <div className="flex flex-col">
        <span className="text-xl font-bold text-primary">Devorc</span>
        <span className="text-sm text-accent -mt-1">Suite</span>
      </div>
    </div>
  );
}
