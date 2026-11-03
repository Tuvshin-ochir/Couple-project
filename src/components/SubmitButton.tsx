"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { hearts, pulseNow, toast } from "@/lib/fx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Дарахаас өмнө асуух асуулт */
  confirm?: string;
  /** Амжилттай дууссаны дараах мэдэгдэл */
  toastMsg?: string;
  /** Зүрхний бороо */
  burst?: number;
};

export default function SubmitButton({ confirm, toastMsg, burst, className = "btn", onClick, children, ...rest }: Props) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (toastMsg) toast(toastMsg);
      if (burst) hearts(burst);
      pulseNow();
    }
    wasPending.current = pending;
  }, [pending, toastMsg, burst]);

  return (
    <button
      type="submit"
      {...rest}
      className={className}
      disabled={pending || rest.disabled}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
