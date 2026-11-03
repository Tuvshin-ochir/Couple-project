"use client";

import { useRef, useState, useTransition } from "react";
import { addMemory } from "@/app/actions";
import { compressImage, hearts, pulseNow, toast } from "@/lib/fx";

const MAX_PHOTOS = 6;

export default function MemoryForm({ today }: { today: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<{ blob: Blob; url: string }[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photos.length);
    e.target.value = "";
    const added: { blob: Blob; url: string }[] = [];
    for (const f of files) {
      try {
        const blob = await compressImage(f);
        added.push({ blob, url: URL.createObjectURL(blob) });
      } catch {
        toast("Зургийг уншиж чадсангүй", "error");
      }
    }
    setPhotos((p) => [...p, ...added]);
  }

  function removePhoto(i: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].url);
      return p.filter((_, j) => j !== i);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    photos.forEach((p, i) => fd.append("photos", p.blob, `photo-${i + 1}.jpg`));
    start(async () => {
      const r = await addMemory(fd);
      if (r?.error) {
        setError(r.error);
        return;
      }
      form.current?.reset();
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setError("");
      setOpen(false);
      toast("📸 Дурсамж хадгалагдлаа");
      hearts(8);
      pulseNow();
    });
  }

  return (
    <details className="card add-box" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>＋ Шинэ дурсамж нэмэх</summary>
      <form ref={form} onSubmit={onSubmit} className="stack">
        <div className="cols2">
          <label className="field">
            <span>Гарчиг</span>
            <input name="title" maxLength={100} required placeholder="Анхны болзоо" />
          </label>
          <label className="field">
            <span>Огноо</span>
            <input type="date" name="date" defaultValue={today} required />
          </label>
        </div>
        <label className="field">
          <span>Хаана</span>
          <input name="place" maxLength={100} placeholder="Улаанбаатар, Зайсан" />
        </label>
        <label className="field">
          <span>Түүх</span>
          <textarea name="story" rows={4} maxLength={4000} placeholder="Тэр өдөр юу болсон бэ?" />
        </label>
        {photos.length > 0 && (
          <div className="thumbs">
            {photos.map((p, i) => (
              <div className="thumb" key={p.url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" />
                <button type="button" className="icon-btn" onClick={() => removePhoto(i)} aria-label="Зураг хасах">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {error && <p className="err">{error}</p>}
        <div className="row between">
          <label className={`btn line sm${photos.length >= MAX_PHOTOS ? " disabled" : ""}`}>
            📷 Зураг нэмэх
            <input type="file" accept="image/*" multiple hidden onChange={onFiles} disabled={photos.length >= MAX_PHOTOS} />
          </label>
          <button className="btn" disabled={pending}>
            {pending ? "Хадгалж байна…" : "Хадгалах"}
          </button>
        </div>
        <p className="small muted">{MAX_PHOTOS} хүртэлх зураг. Зургийг автоматаар жижигрүүлж хадгална.</p>
      </form>
    </details>
  );
}
