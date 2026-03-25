import { createContext, useContext, useState } from "react";
import Modal from "./Modal.jsx";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalContent, setModalContent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false)

  function openModal(content) {
    setModalContent(content);
    setModalVisible(true)
  }

  function closeModal() {
    setModalVisible(false);
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal, modalVisible }}>
      {children}

      {modalContent && (
        <Modal onClose={closeModal} visible={modalVisible}>
            {modalContent}
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export default function useModal() {
  return useContext(ModalContext);
}