import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** An icon followed by text, vertically centred. Used in titles, badges and buttons. */
export function IconText({ icon: Icon, children, className = '', iconClassName = 'h-[1.1em] w-[1.1em]', color }: {
  icon: LucideIcon;
  children?: ReactNode;
  className?: string;
  iconClassName?: string;
  color?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-[0.35em] ${className}`}>
      <Icon className={`shrink-0 ${iconClassName}`} style={color ? { color } : undefined} strokeWidth={2.2} aria-hidden />
      {children}
    </span>
  );
}
