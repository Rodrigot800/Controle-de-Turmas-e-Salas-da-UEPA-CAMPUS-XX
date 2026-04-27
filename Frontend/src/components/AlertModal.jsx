import ReactDOM from "react-dom";
import "../style/alertModal.css";

export default function AlertModal({ visible, type = "info", title, message, onConfirm, onCancel, confirmText = "OK", cancelText = "Cancelar" }) {
  if (!visible) return null;

  const isConfirmType = type === "confirm";

  return ReactDOM.createPortal(
    <div className="alert-backdrop">
      <div className={`alert-modal alert-${type}`}>
        <div className="alert-icon">
          {type === "success" && <span>✓</span>}
          {type === "error" && <span>✕</span>}
          {type === "warning" && <span>⚠</span>}
          {type === "info" && <span>ℹ</span>}
          {type === "confirm" && <span>?</span>}
        </div>

        <div className="alert-content">
          {title && <h3 className="alert-title">{title}</h3>}
          <p className="alert-message">{message}</p>
        </div>

        <div className="alert-buttons">
          {isConfirmType ? (
            <>
              <button className="btn-cancel" onClick={onCancel}>
                {cancelText}
              </button>
              <button className="btn-confirm" onClick={onConfirm}>
                {confirmText}
              </button>
            </>
          ) : (
            <button className={`btn-ok btn-${type}`} onClick={onConfirm}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
