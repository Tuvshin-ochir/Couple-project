import type { Metadata } from "next";
import Link from "next/link";
import { answerWish } from "@/app/actions";
import SubmitButton from "@/components/SubmitButton";
import { Empty } from "@/components/ui";
import SpicyCards from "@/components/vault/SpicyCards";
import VaultBar from "@/components/vault/VaultBar";
import { VaultLock, VaultSetup } from "@/components/vault/VaultGate";
import VaultTile from "@/components/vault/VaultTile";
import VaultUpload from "@/components/vault/VaultUpload";
import { WISHES, WISH_ANSWERS } from "@/lib/content";
import { getCtx, type Ctx } from "@/lib/ctx";
import { rel } from "@/lib/time";
import type { Who } from "@/lib/types";
import { vaultUntil } from "@/lib/vault";

export const metadata: Metadata = { title: "Нууц өрөө", robots: { index: false } };

const TABS = [
  ["photos", "📸 Нууц зураг"],
  ["cards", "🃏 Халуун карт"],
  ["wishes", "🔥 Хүслийн тохирол"],
] as const;

export default async function VaultPage(props: PageProps<"/vault">) {
  const ctx = await getCtx();
  const { s, me, cid } = ctx;

  if (!s.vaultPinHash)
    return (
      <div className="vault">
        <VaultSetup />
      </div>
    );

  const until = await vaultUntil(cid, me, s.vaultPinHash);
  if (!until)
    return (
      <div className="vault">
        <VaultLock />
      </div>
    );

  const sp = await props.searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? (sp.tab as string) : "photos";

  return (
    <div className="vault vault-open">
      <header className="vault-head">
        <div>
          <div className="eyebrow">Хоёулхнаа · 18+</div>
          <h1>Нууц өрөө</h1>
        </div>
        <VaultBar until={until} />
      </header>
      <nav className="tabs">
        {TABS.map(([k, label]) => (
          <Link key={k} href={k === "photos" ? "/vault" : `/vault?tab=${k}`} className={`tab${k === tab ? " on" : ""}`} scroll={false}>
            {label}
          </Link>
        ))}
      </nav>
      {tab === "photos" && <Photos ctx={ctx} />}
      {tab === "cards" && <SpicyCards />}
      {tab === "wishes" && <Wishes ctx={ctx} />}
    </div>
  );
}

async function Photos({ ctx }: { ctx: Ctx }) {
  const { me, names, tz, db } = ctx;
  const photos = await db.vaultPhoto.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, by: true, caption: true, viewOnce: true, viewedAt: true, createdAt: true },
  });
  const now = new Date();

  return (
    <div className="vault-grid">
      <VaultUpload />
      {photos.map((p) => (
        <VaultTile
          key={p.id}
          id={p.id}
          own={p.by === me}
          fromName={names[p.by as Who]}
          caption={p.caption}
          when={rel(p.createdAt, tz, now)}
          viewOnce={p.viewOnce}
          viewed={!!p.viewedAt}
        />
      ))}
      {photos.length === 0 && (
        <p className="vault-empty small">Хоёулхнаа харах зургаа энд хадгалаарай. Бүгд бүрхэгдсэн байдлаар харагдана. 🔐</p>
      )}
    </div>
  );
}

/** Зөвхөн хоёулаа "тийм/магадгүй" гэсэн санаа л ил гарна */
async function Wishes({ ctx }: { ctx: Ctx }) {
  const { me, partner, names, db } = ctx;
  const answers = await db.vaultWish.findMany();
  const mine = new Map(answers.filter((a) => a.by === me).map((a) => [a.item, a.answer]));
  const theirs = new Map(answers.filter((a) => a.by === partner).map((a) => [a.item, a.answer]));
  const matches = WISHES.map((w, i) => ({ w, i, a: mine.get(i), b: theirs.get(i) })).filter(
    (x) => x.a !== undefined && x.b !== undefined && x.a > 0 && x.b > 0,
  );
  const partnerDone = theirs.size;

  return (
    <>
      <section className="vault-card">
        <h2>💞 Хоёулаа хүсдэг</h2>
        {matches.length ? (
          <ul className="wish-matches">
            {matches.map((m) => (
              <li key={m.i} className={m.a === 2 && m.b === 2 ? "hot" : ""}>
                {m.w}
                {m.a === 2 && m.b === 2 && <span className="wish-hot">🔥🔥</span>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty emoji="🤫">
            Доорх санаануудад хариулаарай. {names[partner]} ч мөн хариулсны дараа зөвхөн хоёулаа хүссэн зүйлс энд гарна.
          </Empty>
        )}
        <p className="small vault-note">
          Хэн нь &ldquo;үгүй&rdquo; гэснийг хэзээ ч харуулахгүй. {names[partner]} {partnerDone}/{WISHES.length} хариулсан.
        </p>
      </section>

      <h2 className="sec">Миний хариулт</h2>
      <div className="wish-list">
        {WISHES.map((w, i) => (
          <div key={i} className="wish">
            <span className="grow">{w}</span>
            <div className="wish-opts">
              {WISH_ANSWERS.map(([v, label]) => (
                <form key={v} action={answerWish.bind(null, i, v)}>
                  <SubmitButton className={`wish-opt${mine.get(i) === v ? " on" : ""}`}>{label}</SubmitButton>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
