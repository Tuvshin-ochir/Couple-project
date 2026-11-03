import type { Moment } from "@/generated/prisma/client";
import { deleteMoment, reactMoment } from "@/app/actions";
import { REACTIONS } from "@/lib/content";
import type { Ctx } from "@/lib/ctx";
import { fmtTime } from "@/lib/time";
import Icon from "./Icon";
import MissButton from "./MissButton";
import MomentComposer from "./MomentComposer";
import Polaroid from "./Polaroid";
import SubmitButton from "./SubmitButton";

export type MomentLite = Omit<Moment, "photo" | "thumb">;

export const momentSrc = (m: MomentLite, thumb = false) =>
  m.mime ? `/moments/${m.id}?${thumb ? "s=thumb&" : ""}v=${m.updatedAt.getTime()}` : null;

/**
 * Нэг өдрийн хоёр мөч (би зүүн талд, хайрт баруун талд).
 * Өнөөдөр: хайртынх нь мөч зөвхөн өөрөө хуваалцсаны дараа нээгдэнэ.
 */
export default function MomentPair({
  ctx,
  moments,
  isToday,
  size = "md",
}: {
  ctx: Ctx;
  moments: MomentLite[];
  isToday: boolean;
  size?: "sm" | "md";
}) {
  const { me, partner, names, tz } = ctx;
  const mine = moments.find((m) => m.by === me);
  const theirs = moments.find((m) => m.by === partner);

  return (
    <div className={`pair ${size}`}>
      {/* ── Миний мөч ── */}
      <div className="pair-slot">
        {mine ? (
          <>
            <Polaroid
              who={me}
              name={names[me]}
              src={momentSrc(mine)}
              filter={mine.filter}
              mood={mine.mood}
              caption={mine.caption}
              meta={fmtTime(mine.updatedAt, tz)}
              reaction={mine.reaction}
              tilt={-2.5}
              size={size}
            />
            {isToday && (
              <div className="pair-actions">
                <MomentComposer
                  who={me}
                  name={names[me]}
                  existing={{ mood: mine.mood, caption: mine.caption, filter: mine.filter, src: momentSrc(mine) }}
                  className="btn line sm"
                >
                  <Icon name="edit" size={15} /> Засах
                </MomentComposer>
                <form action={deleteMoment.bind(null, mine.id)}>
                  <SubmitButton className="icon-btn" confirm="Өнөөдрийн мөчөө устгах уу?" aria-label="Устгах">
                    <Icon name="trash" size={17} />
                  </SubmitButton>
                </form>
              </div>
            )}
          </>
        ) : isToday ? (
          <MomentComposer who={me} name={names[me]} className="polaroid-cta">
            <span className="cta-ico">
              <Icon name="camera" size={30} />
            </span>
            <b>Өнөөдрийн мөчөө хуваалц</b>
            <span className="small">Зураг + сэтгэл + нэг өгүүлбэр</span>
          </MomentComposer>
        ) : (
          <EmptySlot text={`${names[me]} энэ өдөр мөч оруулаагүй`} />
        )}
      </div>

      {/* ── Хайртын мөч ── */}
      <div className="pair-slot">
        {theirs && (mine || !isToday) ? (
          <>
            <Polaroid
              who={partner}
              name={names[partner]}
              src={momentSrc(theirs)}
              filter={theirs.filter}
              mood={theirs.mood}
              caption={theirs.caption}
              meta={fmtTime(theirs.updatedAt, tz)}
              reaction={theirs.reaction}
              tilt={2.5}
              size={size}
            />
            <div className="reactions" aria-label="Хариу үлдээх">
              {REACTIONS.map((e) => (
                <form key={e} action={reactMoment.bind(null, theirs.id, e)}>
                  <SubmitButton className={`react${theirs.reaction === e ? " on" : ""}`} aria-label={`${e} үлдээх`}>
                    {e}
                  </SubmitButton>
                </form>
              ))}
            </div>
          </>
        ) : theirs ? (
          <div className="polaroid-locked">
            <span className="cta-ico">
              <Icon name="lock" size={28} />
            </span>
            <b>{names[partner]} мөчөө хуваалцсан!</b>
            <span className="small">Чи өөрийнхөө мөчийг хуваалцвал нээгдэнэ</span>
          </div>
        ) : isToday ? (
          <div className="polaroid-wait">
            <span className="cta-ico">
              <Icon name="clock" size={26} />
            </span>
            <b>{names[partner]} хараахан хуваалцаагүй</b>
            <MissButton variant="pill" />
          </div>
        ) : (
          <EmptySlot text={`${names[partner]} энэ өдөр мөч оруулаагүй`} />
        )}
      </div>
    </div>
  );
}

function EmptySlot({ text }: { text: string }) {
  return (
    <div className="polaroid-wait">
      <span className="cta-ico">
        <Icon name="clock" size={26} />
      </span>
      <span className="small">{text}</span>
    </div>
  );
}
