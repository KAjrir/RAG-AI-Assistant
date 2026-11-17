// modals/ModalContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import Modal from './Modal.jsx';

// Moet gelijk zijn aan de sluit-animatie in je modal CSS
const CLOSE_ANIMATION_MS = 200;

const ModalContext = createContext(null);

// Let op: de inhoud van de modal wordt HIER gerenderd, niet waar je openModal()
// aanroept. Hooks in de modal-inhoud (useNavigate, useWorkspace, …) werken dus
// alleen als die providers boven ModalProvider staan. Geef data en callbacks
// liever mee als props, zoals ConfirmModal doet.
export function ModalProvider({ children }) {
  const [content, setContent]         = useState(null);
  const [visible, setVisible]         = useState(false);
  const [dismissible, setDismissible] = useState(true);
  const clearTimerRef                 = useRef(null);
  const { pathname }                  = useLocation();

  const openModal = useCallback((node) => {
    clearTimeout(clearTimerRef.current);
    setDismissible(true);
    setContent(node);
    setVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    clearTimeout(clearTimerRef.current);
    // Inhoud pas weghalen na de animatie, anders "springt" de modal leeg
    clearTimerRef.current = setTimeout(() => setContent(null), CLOSE_ANIMATION_MS);
  }, []);

  // Sluiten via overlay, ✕ of Escape mag niet terwijl er iets bezig is
  const requestClose = useCallback(() => {
    if (dismissible) closeModal();
  }, [dismissible, closeModal]);

  // Bij navigeren (bijv. terug-knop) de modal sluiten
  useEffect(() => {
    closeModal();
  }, [pathname, closeModal]);

  useEffect(() => () => clearTimeout(clearTimerRef.current), []);

  const value = useMemo(
    () => ({ openModal, closeModal, setDismissible, modalVisible: visible }),
    [openModal, closeModal, visible]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}

      {content && (
        <Modal visible={visible} onClose={requestClose} closable={dismissible}>
          {content}
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export default function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}