import { useState } from "react";

export default function Modal({ children, onClose, visible}) {
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div className={`modal-overlay ${visible ? "" : "close"}`} onClick={handleOverlayClick}>
      <div className={`modal ${visible ? "" : "close"}`}>

        <button className="close-button" onClick={onClose}>
          ✕
        </button>

        {children}

      </div>
    </div>
  );
}