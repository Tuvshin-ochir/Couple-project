"use client";

import { useRef, useState, useTransition } from "react";
import { addVaultPhoto } from "@/app/actions";
import { compressImage, pulseNow, toast } from "@/lib/fx";
import Icon from "../Icon";
import Modal from "../Modal";

export default function VaultUpload() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [viewOnce, setViewOnce] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const blobs = useRef<{ photo: Blob; thumb: Blob } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCaption("");
    setViewOnce(false);
    setError("");
    blobs.current = null;
  };

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const [photo, thumb] = await Promise.all([compressImage(f, 1800, 0.86), compressImage(f, 480, 0.72)]);
      if (preview) URL.revokeObjectURL(preview);
      blobs.current = { photo, thumb };
      setPreview(URL.createObjectURL(photo));
      setOpen(true);
    } catch {
      toast("Зургийг уншиж чадсангүй", "error");
    } finally {
      setBusy(false);
    }
  }

  function send() {
    if (!blobs.current) return;
    const fd = new FormData();
    fd.append("photo", blobs.current.photo, "p.jpg");
    fd.append("thumb", blobs.current.thumb, "t.jpg");
    fd.set("caption", caption);
    if (viewOnce) fd.set("viewOnce", "1");
    start(async () => {
      const r = await addVaultPhoto(fd);
      if (r?.error) return setError(r.error);
      setOpen(false);
      reset();
      toast(viewOnce ? "🔥 Нэг удаа харах зураг илгээгдлээ" : "🔒 Нууц өрөөнд нэмэгдлээ");
      pulseNow();
    });
  }

  return (
    <>
      <button type="button" className="vault-add" onClick={() => input.current?.click()} disabled={busy}>
        <Icon name="plus" size={26} />
        <span>{busy ? "Боловсруулж байна…" : "Зураг нэмэх"}</span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
      >
        <div className="dlg vault-dlg stack">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="" className="vault-preview" />}
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="Хэдэн үг нэмэх үү? 😏" />
          <label className="vault-toggle">
            <input type="checkbox" checked={viewOnce} onChange={(e) => setViewOnce(e.target.checked)} />
            <span className="toggle-ui" aria-hidden="true" />
            <span>
              <b>🔥 Нэг удаа харах</b>
              <span className="small">Хайрт чинь нэг үзмэгц бүрмөсөн устна</span>
            </span>
          </label>
          {error && <p className="err">{error}</p>}
          <button className="btn wide" onClick={send} disabled={pending}>
            {pending ? "Илгээж байна…" : "Илгээх 💋"}
          </button>
        </div>
      </Modal>
    </>
  );
}
