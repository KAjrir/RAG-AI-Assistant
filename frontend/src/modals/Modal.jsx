// modals/Modal.jsx
import { useEffect, useRef } from 'react';
import '../styles/modal.css';

export default function Modal({ children, onClose, visible, closable = true }) {
  const modalRef   = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // altijd de nieuwste, zonder de effect opnieuw te draaien

  // Escape sluit, achtergrond scrollt niet mee, focus naar de modal
  useEffect(() => {
    if (!visible) return;

    function handleKey(e) {
      if (e.key === 'Escape') onCloseRef.current();
    }

    const previousOverflow   = document.body.style.overflow;
    const previouslyFocused  = document.activeElement;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    modalRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [visible]);

  // mousedown i.p.v. click: tekst selecteren en loslaten buiten de modal sluit hem niet
  function handleOverlayMouseDown(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className={`modal-overlay ${visible ? '' : 'close'}`}
      onMouseDown={handleOverlayMouseDown}
      aria-hidden={!visible}
    >
      <div
        ref={modalRef}
        className={`modal ${visible ? '' : 'close'}`}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <button
          type="button"
          className="close-button"
          onClick={onClose}
          disabled={!closable}
          aria-label="Sluiten"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}