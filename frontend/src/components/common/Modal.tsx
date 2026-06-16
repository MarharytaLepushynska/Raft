import type { FormEvent, ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  variant?: 'confirm';
  as?: 'form';
  onSubmit?: (event: FormEvent) => void;
}

/** Base modal: a scrim that closes on click plus a centered card (optionally rendered as a `<form>`). */
export function Modal({ onClose, children, variant, as, onSubmit }: ModalProps) {
  const cardClass = variant === 'confirm' ? 'modal__card modal__card--confirm' : 'modal__card';
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__scrim" onClick={onClose} />
      {as === 'form' ? (
        <form className={cardClass} onSubmit={onSubmit}>
          {children}
        </form>
      ) : (
        <div className={cardClass}>{children}</div>
      )}
    </div>
  );
}
