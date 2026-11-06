import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-700/40',
  secondary: 'bg-amber-400 text-stone-900 hover:bg-amber-500 disabled:bg-amber-400/40',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-600/40',
  ghost: 'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100 disabled:text-stone-400',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
