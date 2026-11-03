"use client";

import { useState } from "react";
import Modal from "./Modal";

export default function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="zoom" onClick={() => setOpen(true)} aria-label="Томруулж харах">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} wide>
        <div className="dlg dlg-img" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} />
        </div>
      </Modal>
    </>
  );
}
