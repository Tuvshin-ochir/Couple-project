import type { Metadata } from "next";
import { deleteMemory } from "@/app/actions";
import Avatar from "@/components/Avatar";
import MemoryForm from "@/components/MemoryForm";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import ZoomImage from "@/components/ZoomImage";
import { Empty, PageHead } from "@/components/ui";
import { getCtx } from "@/lib/ctx";
import { dayKey, fmtKey, utcKey } from "@/lib/time";
import type { Who } from "@/lib/types";

export const metadata: Metadata = { title: "Дурсамж" };

export default async function MemoriesPage() {
  const { names, tz, db } = await getCtx();
  const memories = await db.memory.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { photos: { select: { id: true } } },
  });

  // Он оноор бүлэглэнэ
  const years = new Map<string, typeof memories>();
  for (const m of memories) {
    const y = utcKey(m.date).slice(0, 4);
    years.set(y, [...(years.get(y) ?? []), m]);
  }

  return (
    <>
      <PageHead emoji="📸" title="Дурсамж" sub="Хамтдаа өнгөрүүлсэн мөчүүдийн цагийн хэлхээс." />
      <MemoryForm today={dayKey(new Date(), tz)} />

      {memories.length === 0 ? (
        <Empty emoji="🎞️">Анхны дурсамжаа нэмээрэй — анх танилцсан өдөр, анхны аялал…</Empty>
      ) : (
        <div className="timeline">
          {[...years].map(([year, list]) => (
            <section key={year}>
              <h2 className="tl-year">{year}</h2>
              {list.map((m) => {
                const by = m.by as Who;
                return (
                  <article key={m.id} className="card mem">
                    <div className="mem-date">{fmtKey(utcKey(m.date))}</div>
                    <h3>{m.title}</h3>
                    {m.place && <div className="small muted">📍 {m.place}</div>}
                    {m.story && <p className="pre">{m.story}</p>}
                    {m.photos.length > 0 && (
                      <div className="mem-photos">
                        {m.photos.map((p) => (
                          <ZoomImage key={p.id} src={`/photos/${p.id}`} alt={m.title} />
                        ))}
                      </div>
                    )}
                    <footer className="row small muted">
                      <Avatar who={by} name={names[by]} size="sm" /> {names[by]} нэмсэн
                      <span className="grow" />
                      <form action={deleteMemory.bind(null, m.id)}>
                        <SubmitButton className="icon-btn" confirm="Энэ дурсамжийг зурагтай нь устгах уу?" aria-label="Устгах">
                          <Icon name="trash" size={17} />
                        </SubmitButton>
                      </form>
                    </footer>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
