import type { ReactNode } from 'react';

interface ModalProps {
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  accent?: string;
  wide?: boolean;
}

export function Modal({ title, children, footer, onClose, accent, wide = false }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`animate-pop flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-xl' : 'max-w-sm'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-5 py-3 text-lg font-bold text-white" style={{ background: accent ?? '#047857' }}>
            {title}
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex gap-2 border-t border-stone-100 bg-stone-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
