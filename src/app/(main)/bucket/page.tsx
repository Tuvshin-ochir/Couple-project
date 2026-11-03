import type { Metadata } from "next";
import { addBucket, deleteBucket, toggleBucket } from "@/app/actions";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { Empty, PageHead, Tabs } from "@/components/ui";
import { BUCKET_IDEAS } from "@/lib/content";
import { getCtx } from "@/lib/ctx";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/time";
import type { Who } from "@/lib/types";

export const metadata: Metadata = { title: "Мөрөөдөл" };

const FILTERS = [
  ["all", "Бүгд"],
  ["todo", "Хийх"],
  ["done", "Биелсэн ✓"],
] as const;

export default async function BucketPage(props: PageProps<"/bucket">) {
  const { names, tz } = await getCtx();
  const f = (await props.searchParams).f;
  const filter = f === "todo" || f === "done" ? f : "all";
  const items = await prisma.bucketItem.findMany({ orderBy: { createdAt: "desc" } });

  const done = items.filter((x) => x.doneAt).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const shown = items
    .filter((x) => filter === "all" || (filter === "done" ? x.doneAt : !x.doneAt))
    .sort((a, b) => Number(!!a.doneAt) - Number(!!b.doneAt));
  const have = new Set(items.map((x) => x.text.toLowerCase()));
  const suggestions = BUCKET_IDEAS.filter((t) => !have.has(t.toLowerCase())).slice(0, 10);

  return (
    <>
      <PageHead emoji="✨" title="Хамтдаа хийх зүйлс" sub="Мөрөөдлийн жагсаалт — нэг нэгээр нь биелүүлье." />

      <form action={addBucket} className="card compose row">
        <input name="text" maxLength={140} placeholder="Жишээ нь: Хамтдаа Хөвсгөл нуурт очих" required />
        <SubmitButton>Нэмэх</SubmitButton>
      </form>

      <div className="card">
        <div className="row between">
          <b>
            {done} / {items.length} биелсэн
          </b>
          <span className="muted">{pct}%</span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Tabs items={FILTERS} current={filter} href={(k) => (k === "all" ? "/bucket" : `/bucket?f=${k}`)} />

      {shown.length ? (
        <ul className="check-list">
          {shown.map((x) => (
            <li key={x.id} className={`check-item${x.doneAt ? " done" : ""}`}>
              <form action={toggleBucket.bind(null, x.id)}>
                <SubmitButton
                  className="cbox"
                  aria-label={x.doneAt ? "Биелээгүй болгох" : "Биелсэн гэж тэмдэглэх"}
                  burst={x.doneAt ? 0 : 10}
                  toastMsg={x.doneAt ? undefined : "🎉 Нэг мөрөөдөл биеллээ!"}
                >
                  {x.doneAt ? "✓" : ""}
                </SubmitButton>
              </form>
              <div className="grow">
                <div className="t">{x.text}</div>
                <div className="small muted">
                  {x.doneAt ? `Биелсэн: ${fmtDate(x.doneAt, tz)}` : `${names[x.by as Who]} нэмсэн`}
                </div>
              </div>
              <form action={deleteBucket.bind(null, x.id)}>
                <SubmitButton className="icon-btn" confirm="Жагсаалтаас хасах уу?" aria-label="Устгах">
                  <Icon name="trash" size={17} />
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <Empty emoji="🌠">{items.length ? "Энд одоохондоо юу ч алга." : "Хамтдаа хийхийг хүсдэг зүйлсээ нэмээрэй."}</Empty>
      )}

      {suggestions.length > 0 && (
        <>
          <h2 className="sec">💡 Санаа</h2>
          <div className="chips">
            {suggestions.map((t) => (
              <form key={t} action={addBucket}>
                <input type="hidden" name="text" value={t} />
                <SubmitButton className="chip">＋ {t}</SubmitButton>
              </form>
            ))}
          </div>
        </>
      )}
    </>
  );
}
