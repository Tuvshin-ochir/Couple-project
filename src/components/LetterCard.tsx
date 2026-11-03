"use client";

import { useState, useTransition } from "react";
import { deleteLetter, openLetter } from "@/app/actions";
import { toast } from "@/lib/fx";
import type { Who } from "@/lib/types";
import Avatar from "./Avatar";
import Modal from "./Modal";
import Icon from "./Icon";
import SubmitButton from "./SubmitButton";

type Props = {
  id: string;
  title: string;
  by: Who;
  fromName: string;
  dateText: string;
  own: boolean;
  status: string;
  /** Зөвхөн өөрийн бичсэн эсвэл аль хэдийн нээсэн захидалд ирнэ */
  body: string | null;
};

export default function LetterCard({ id, title, by, fromName, dateText, own, status, body }: Props) {
  const [text, setText] = useState(body);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const sealed = !own && text === null;

  const unseal = () => {
    if (!window.confirm(`"${title}" — яг одоо нээх үү?`)) return;
    start(async () => {
      const r = await openLetter(id);
      if (!r) return toast("Захидал олдсонгүй", "error");
      setText(r.body);
      setOpen(true);
    });
  };

  return (
    <article className={`env${sealed ? " sealed" : ""}`}>
      <div className="small muted">Хэзээ нээх:</div>
      <h3>{title}</h3>
      <div className="small muted row">
        <Avatar who={by} name={fromName} size="sm" /> {fromName} · {dateText}
      </div>
      <div className="row">
        {own && <span className="small">{status}</span>}
        <span className="grow" />
        {sealed ? (
          <button className="btn sm" onClick={unseal} disabled={pending}>
            Нээх 💌
          </button>
        ) : (
          <button className="btn line sm" onClick={() => setOpen(true)}>
            {own ? "Унших" : "Дахин унших"}
          </button>
        )}
        {own && (
          <form action={deleteLetter.bind(null, id)}>
            <SubmitButton className="icon-btn" confirm="Энэ захидлыг устгах уу?" aria-label="Устгах">
              <Icon name="trash" size={17} />
            </SubmitButton>
          </form>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="dlg">
          <div className="small muted">Хэзээ нээх:</div>
          <h2 className="dlg-title">{title}</h2>
          <div className="paper">{text}</div>
          <div className="row between">
            <span className="small muted">
              — {fromName}, {dateText}
            </span>
            <button className="btn" onClick={() => setOpen(false)}>
              Хаах
            </button>
          </div>
        </div>
      </Modal>
    </article>
  );
}
