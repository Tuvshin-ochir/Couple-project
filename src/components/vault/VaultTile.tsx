"use client";

import { useState, useTransition } from "react";
import { deleteVaultPhoto, openOnceVaultPhoto } from "@/app/actions";
import { toast } from "@/lib/fx";
import Icon from "../Icon";
import Modal from "../Modal";
import SubmitButton from "../SubmitButton";

type Props = {
  id: string;
  own: boolean;
  fromName: string;
  caption: string;
  when: string;
  viewOnce: boolean;
  viewed: boolean;
};

/** Нууц зураг — анхнаасаа бүрхэгдсэн, дарахад л томоор нээгдэнэ */
export default function VaultTile({ id, own, fromName, caption, when, viewOnce, viewed }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sealed = viewOnce && !own; // хайртаас ирсэн "нэг удаа" зураг — урьдчилж харагдахгүй

  const open = () => {
    if (!viewOnce) return setSrc(`/vault-photos/${id}`);
    if (!own && !window.confirm("Энэ зураг нэг л удаа харагдана. Одоо нээх үү? 🔥")) return;
    start(async () => {
      const r = await openOnceVaultPhoto(id);
      if (r.error) return toast(r.error, "error");
      setSrc(r.src!);
    });
  };

  if (viewed)
    return (
      <div className="vault-tile burned">
        <span className="burn-ico">🔥</span>
        <b>{own ? "Хайрт чинь үзсэн" : "Үзсэн"}</b>
        <span className="small">{when}</span>
        {own && (
          <form action={deleteVaultPhoto.bind(null, id)}>
            <SubmitButton className="icon-btn" aria-label="Устгах">
              <Icon name="trash" size={16} />
            </SubmitButton>
          </form>
        )}
      </div>
    );

  return (
    <div className={`vault-tile${sealed ? " sealed" : ""}`}>
      <button type="button" className="vault-tile-btn" onClick={open} disabled={pending} aria-label="Нээж харах">
        {!sealed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/vault-photos/${id}?s=thumb`} alt="" loading="lazy" />
        )}
        <span className="vault-veil">
          {sealed ? (
            <>
              <span className="burn-ico">🔥</span>
              <b>Нэг удаа харах</b>
              <span className="small">{fromName} илгээлээ</span>
            </>
          ) : (
            <>
              <Icon name="lock" size={22} />
              <span className="small">Дарж харах</span>
            </>
          )}
        </span>
        {viewOnce && own && <span className="vault-badge">🔥 Хүлээж байна</span>}
      </button>
      <div className="vault-meta">
        <span className="grow">
          {fromName} · {when}
        </span>
        {own && (
          <form action={deleteVaultPhoto.bind(null, id)}>
            <SubmitButton className="icon-btn" confirm="Энэ зургийг бүрмөсөн устгах уу?" aria-label="Устгах">
              <Icon name="trash" size={16} />
            </SubmitButton>
          </form>
        )}
      </div>

      <Modal open={!!src} onClose={() => setSrc(null)} wide>
        <div className="dlg dlg-img vault-view" onClick={() => setSrc(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img src={src} alt={caption} />}
          {caption && <p className="vault-caption">{caption}</p>}
          {viewOnce && !own && <p className="small center vault-note">Хаахад энэ зураг бүрмөсөн алга болно 🔥</p>}
        </div>
      </Modal>
    </div>
  );
}
