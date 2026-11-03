"use client";

import { useRef, useState, useTransition } from "react";
import { removeAvatar, setAvatar } from "@/app/actions";
import { pulseNow, toast } from "@/lib/fx";
import type { Who } from "@/lib/types";
import Avatar from "./Avatar";
import Icon from "./Icon";

/** Төвөөс нь дөрвөлжин тайрч 400px болгоно */
function squareCrop(file: File, size = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas
        .getContext("2d")!
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.86);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

export default function AvatarUploader({ who, name, has }: { who: Who; name: string; has: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const blob = await squareCrop(f);
      const fd = new FormData();
      fd.append("photo", blob, "avatar.jpg");
      start(async () => {
        const r = await setAvatar(who, fd);
        if (r?.error) toast(r.error, "error");
        else {
          toast("✓ Профайл зураг солигдлоо");
          pulseNow();
        }
      });
    } catch {
      toast("Зургийг уншиж чадсангүй", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avatar-edit">
      <button type="button" className="avatar-btn" onClick={() => input.current?.click()} disabled={pending || busy} aria-label={`${name} — зураг солих`}>
        <Avatar who={who} name={name} size="xl" />
        <span className="avatar-cam">
          <Icon name="camera" size={16} />
        </span>
      </button>
      <b>{name}</b>
      {has && (
        <button
          type="button"
          className="link-btn"
          disabled={pending}
          onClick={() => start(async () => void (await removeAvatar(who)))}
        >
          Зураг хасах
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}
