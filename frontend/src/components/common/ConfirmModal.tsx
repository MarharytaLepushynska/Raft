import type { ReactNode } from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  title: string;
  text: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A reusable confirm/cancel dialog, shown before deletes and other destructive actions. */
export function ConfirmModal({ title, text, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal variant="confirm" onClose={onCancel}>
      <h2 className="modal__title">{title}</h2>
      <p className="modal__text">{text}</p>
      <div className="modal__actions">
        <span className="modal__spacer" />
        <button type="button" className="modal__btn modal__btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="modal__btn modal__btn--danger-solid" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
