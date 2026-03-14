import useModal from "./ModalContext.jsx";

export default function ProfileModal() {
  const { closeModal } = useModal();

  return (
    <div className="profile-modal">

      <h2>Your Profile</h2>

      <div className="profile-section">
        <div className="profile-avatar-large">KA</div>

        <div className="profile-info">
          <span className="profile-name">Karim Ajrir</span>
          <span className="profile-plan">Plus Plan</span>
        </div>
      </div>

      <div className="profile-actions">
        <button className="profile-btn">Settings</button>
        <button className="profile-btn">Billing</button>
        <button className="profile-btn logout">Log out</button>
      </div>

    </div>
  );
}