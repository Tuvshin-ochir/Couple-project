"use client";

import { useRef, useState, useTransition } from "react";
import { postMoment } from "@/app/actions";
import { MOODS, PHOTO_FILTERS, filterCss } from "@/lib/content";
import { compressImage, hearts, pulseNow, toast } from "@/lib/fx";
import type { Who } from "@/lib/types";
import Icon from "./Icon";
import Modal from "./Modal";
import Polaroid from "./Polaroid";

type Existing = { mood: string; caption: string; filter: string; src: string | null };

type Props = {
  who: Who;
  name: string;
  existing?: Existing;
  className?: string;
  children: React.ReactNode; // нээх товчны агуулга
};

/** Өдрийн мөч оруулах цонх — зураг, шүүлтүүр, сэтгэл, тайлбар, шууд урьдчилан харах */
export default function MomentComposer({ who, name, existing, className = "btn", children }: Props) {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState(existing?.mood ?? "good");
  const [caption, setCaption] = useState(existing?.caption ?? "");
  const [filter, setFilter] = useState(existing?.filter ?? "none");
  const [preview, setPreview] = useState<string | null>(existing?.src ?? null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const blobs = useRef<{ photo: Blob; thumb: Blob } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    blobs.current = null;
    setMood(existing?.mood ?? "good");
    setCaption(existing?.caption ?? "");
    setFilter(existing?.filter ?? "none");
    setPreview(existing?.src ?? null);
    setRemoved(false);
    setError("");
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const [photo, thumb] = await Promise.all([compressImage(f, 1600, 0.84), compressImage(f, 420, 0.72)]);
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
      blobs.current = { photo, thumb };
      setPreview(URL.createObjectURL(photo));
      setRemoved(false);
    } catch {
      toast("Зургийг уншиж чадсангүй", "error");
    } finally {
      setBusy(false);
    }
  }

  function removePhoto() {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    blobs.current = null;
    setPreview(null);
    setRemoved(true);
  }

  function submit() {
    const fd = new FormData();
    fd.set("mood", mood);
    fd.set("caption", caption);
    fd.set("filter", filter);
    if (blobs.current) {
      fd.append("photo", blobs.current.photo, "moment.jpg");
      fd.append("thumb", blobs.current.thumb, "thumb.jpg");
    } else if (removed) {
      fd.set("removePhoto", "1");
    }
    start(async () => {
      const r = await postMoment(fd);
      if (r?.error) {
        setError(r.error);
        return;
      }
      blobs.current = null;
      setOpen(false);
      toast(existing ? "📸 Мөч шинэчлэгдлээ" : "📸 Өнөөдрийн мөч хуваалцагдлаа");
      hearts(12);
      pulseNow();
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <Modal open={open} onClose={close} wide>
        <div className="dlg composer">
          <button type="button" className="icon-btn dlg-x" onClick={close} aria-label="Хаах">
            <Icon name="x" />
          </button>
          <div className="composer-preview">
            <Polaroid who={who} name={name} src={preview} filter={filter} mood={mood} caption={caption} meta="Өнөөдөр" tilt={-2}>
              {!preview && (
                <button type="button" className="ph-pick" onClick={() => fileInput.current?.click()} disabled={busy}>
                  <Icon name="camera" size={34} />
                  <span>{busy ? "Боловсруулж байна…" : "Зураг нэмэх"}</span>
                </button>
              )}
            </Polaroid>
          </div>

          <div className="composer-controls">
            <h2 className="dlg-title">Өнөөдрийн мөч</h2>
            <p className="small muted">Өнөөдрийг нэг зураг, нэг сэтгэлээр хадгалъя.</p>

            <div className="row">
              <button type="button" className="btn line sm" onClick={() => fileInput.current?.click()} disabled={busy}>
                <Icon name="camera" size={16} /> {preview ? "Зураг солих" : "Зураг сонгох"}
              </button>
              {preview && (
                <button type="button" className="btn line sm" onClick={removePhoto}>
                  <Icon name="x" size={16} /> Зураггүй
                </button>
              )}
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={pick} />
            </div>

            {preview && (
              <div className="field">
                <span>Шүүлтүүр</span>
                <div className="filters">
                  {PHOTO_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`filter-chip${filter === f.key ? " on" : ""}`}
                      onClick={() => setFilter(f.key)}
                      aria-pressed={filter === f.key}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="" style={{ filter: filterCss(f.key) }} />
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <span>Өнөөдөр ямар байна?</span>
              <div className="mood-chips">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className={`mood-chip${mood === m.key ? " on" : ""}`}
                    onClick={() => setMood(m.key)}
                    aria-pressed={mood === m.key}
                  >
                    <em aria-hidden="true">{m.emoji}</em>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="field">
              <span>Тайлбар</span>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={120}
                placeholder="Өнөөдөр ямар өдөр байв? ✍️"
              />
            </label>

            {error && <p className="err">{error}</p>}
            <button type="button" className="btn wide" onClick={submit} disabled={pending || busy}>
              {pending ? "Хуваалцаж байна…" : existing ? "Шинэчлэх 💞" : "Хуваалцах 💞"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
