"use client";

import { useTransition } from "react";
import { sendNudge } from "@/app/actions";
import { toast } from "@/lib/fx";
import type { Who } from "@/lib/types";
import Avatar from "./Avatar";
import Icon from "./Icon";

/** Хайртаасаа "санаж байна" ирэхэд гарах цонх — зураг нь, эргэн тойронд зөөлөн долгио */
export default function MissOverlay({ who, name, onClose }: { who: Who; name: string; onClose: () => void }) {
  const [pending, start] = useTransition();

  const reply = () =>
    start(async () => {
      await sendNudge();
      toast("Хариу илгээлээ");
      onClose();
    });

  return (
    <div className="miss-ov" role="dialog" aria-modal="true" aria-label={`${name} чамайг санаж байна`} onClick={onClose}>
      <div className="miss-ov-card" onClick={(e) => e.stopPropagation()}>
        <div className="miss-ov-ripple" aria-hidden="true">
          <i className="miss-ov-ring" />
          <i className="miss-ov-ring" />
          <i className="miss-ov-ring" />
          <Avatar who={who} name={name} size="xl" />
          <span className="miss-ov-heart">
            <Icon name="heart" size={18} />
          </span>
        </div>
        <p className="miss-ov-eyebrow">Яг одоо</p>
        <h2>{name} чамайг санаж байна</h2>
        <p className="muted">Хайр чинь чамайг бодож байна гэнээ.</p>
        <div className="miss-ov-actions">
          <button className="btn wide" onClick={reply} disabled={pending}>
            Би ч бас санаж байна
          </button>
          <button className="btn line wide" onClick={onClose}>
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
