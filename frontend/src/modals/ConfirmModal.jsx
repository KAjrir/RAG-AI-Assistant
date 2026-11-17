// modals/ConfirmModal.jsx
//
// Gebruik:
//   openModal(
//     <ConfirmModal
//       title="Gesprek verwijderen"
//       description={<>Weet je zeker dat je <strong>{naam}</strong> wilt verwijderen?</>}
//       confirmLabel="Verwijderen"
//       busyLabel="Verwijderen…"
//       danger
//       onConfirm={async () => { ... }}   // gooi een error om de modal open te houden
//     />
//   );

import { useState } from 'react';
import useModal from './ModalContext.jsx';
import '../styles/confirmModal.css';

export default function ConfirmModal({
  title,
  description,
  confirmLabel = 'Bevestigen',
  busyLabel,
  cancelLabel  = 'Annuleren',
  danger       = false,
  onConfirm,
}) {
  const { closeModal, setDismissible } = useModal();
  const [busy, setBusy]                = useState(false);

  async function handleConfirm() {
    setBusy(true);
    setDismissible(false);
    try {
      await onConfirm?.();
      closeModal();
    } catch {
      // onConfirm toont zelf de fout-toast; modal blijft open voor nog een poging
    } finally {
      setBusy(false);
      setDismissible(true);
    }
  }

  return (
    <div className="cm-root">
      <div className={`cm-icon ${danger ? 'cm-icon--danger' : ''}`}>
        {danger ? <TrashIcon /> : <QuestionIcon />}
      </div>

      <div className="cm-body">
        <h2 className="cm-title">{title}</h2>
        {description && <p className="cm-desc">{description}</p>}
      </div>

      <div className="cm-footer">
        <button type="button" className="cm-btn-secondary" onClick={closeModal} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={danger ? 'cm-btn-danger' : 'cm-btn-primary'}
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? (busyLabel ?? `${confirmLabel}…`) : confirmLabel}
        </button>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.2 6.2a1.9 1.9 0 0 1 3.6.8c0 1.3-1.8 1.6-1.8 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="8" cy="11.6" r="0.7" fill="currentColor"/>
    </svg>
  );
}