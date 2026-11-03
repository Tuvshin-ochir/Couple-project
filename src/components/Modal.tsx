"use client";

import { useEffect, useRef } from "react";

export default function Modal({
  open,
  onClose,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={wide ? "wide" : undefined}
      onClose={onClose}
      onClick={(e) => {
        // Арын бүдэг хэсэг дээр дарвал хаагдана
        if (e.target === ref.current) onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}
