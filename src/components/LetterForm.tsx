"use client";

import { useRef } from "react";
import { addLetter } from "@/app/actions";
import { OPEN_WHEN } from "@/lib/content";
import SubmitButton from "./SubmitButton";

export default function LetterForm() {
  const title = useRef<HTMLInputElement>(null);

  return (
    <form action={addLetter} className="card compose">
      <label className="field">
        <span>Хэзээ нээх вэ?</span>
        <input ref={title} name="title" maxLength={80} placeholder="жишээ нь: Намайг санасан үедээ" required />
      </label>
      <div className="chips">
        {OPEN_WHEN.map((t) => (
          <button
            key={t}
            type="button"
            className="chip"
            onClick={() => {
              if (title.current) {
                title.current.value = t;
                title.current.focus();
              }
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Захидал</span>
        <textarea name="body" rows={7} maxLength={8000} placeholder="Зүрх сэтгэлээсээ бичээрэй…" required />
      </label>
      <div className="row between">
        <span className="small muted">Хайрт чинь нээх хүртэл агуулга нь битүүмжлэгдсэн байна.</span>
        <SubmitButton toastMsg="✉️ Захидал битүүмжлэгдлээ">Битүүмжлэх ✉️</SubmitButton>
      </div>
    </form>
  );
}
