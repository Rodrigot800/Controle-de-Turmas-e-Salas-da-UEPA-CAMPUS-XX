import { useState } from "react";

export function useAlert() {
  const [alert, setAlert] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancelar",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showAlert = (message, title = "", type = "info") => {
    setAlert((prev) => ({
      ...prev,
      visible: true,
      type,
      title: title || getDefaultTitle(type),
      message,
      onConfirm: () => {
        setAlert((prev) => ({ ...prev, visible: false }));
      },
      onCancel: () => {
        setAlert((prev) => ({ ...prev, visible: false }));
      },
    }));
  };

  const showConfirm = (message, onConfirm, onCancel = null, title = "") => {
    setAlert((prev) => ({
      ...prev,
      visible: true,
      type: "confirm",
      title: title || "Confirmar",
      message,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      onConfirm: () => {
        setAlert((prev) => ({ ...prev, visible: false }));
        onConfirm();
      },
      onCancel: () => {
        setAlert((prev) => ({ ...prev, visible: false }));
        onCancel?.();
      },
    }));
  };

  const success = (message, title = "Sucesso") =>
    showAlert(message, title, "success");
  const error = (message, title = "Erro") => showAlert(message, title, "error");
  const warning = (message, title = "Aviso") =>
    showAlert(message, title, "warning");
  const info = (message, title = "Informação") =>
    showAlert(message, title, "info");

  return {
    alert,
    showAlert,
    showConfirm,
    success,
    error,
    warning,
    info,
    hideAlert: () => setAlert((prev) => ({ ...prev, visible: false })),
  };
}

function getDefaultTitle(type) {
  switch (type) {
    case "success":
      return "Sucesso";
    case "error":
      return "Erro";
    case "warning":
      return "Aviso";
    case "confirm":
      return "Confirmar";
    default:
      return "Informação";
  }
}
