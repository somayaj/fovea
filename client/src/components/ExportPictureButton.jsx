import { useState } from "react";
import { HeaderOutlineButton } from "./PageHeader.jsx";
import { IconDownload } from "./icons.jsx";
import { downloadElementPng } from "../lib/exportPicture.js";

export default function ExportPictureButton({ targetRef, filename, label = "Export" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    setError("");
    setBusy(true);
    try {
      await downloadElementPng(targetRef.current, filename);
    } catch (err) {
      setError(err.message || "Could not export picture.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <HeaderOutlineButton
      onClick={onClick}
      disabled={busy}
      title={error || "Download a picture of this view"}
    >
      <IconDownload size={13} />
      {busy ? "Saving…" : error ? "Retry export" : label}
    </HeaderOutlineButton>
  );
}
