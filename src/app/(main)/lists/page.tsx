import type { Metadata } from "next";
import { addListItem, deleteListItem, toggleListItem } from "@/app/actions";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { Empty, PageHead, Tabs } from "@/components/ui";
import { LIST_TYPES, listTypeOf } from "@/lib/content";
import { getCtx } from "@/lib/ctx";
import type { Who } from "@/lib/types";

export const metadata: Metadata = { title: "Жагсаалт" };

export default async function ListsPage(props: PageProps<"/lists">) {
  const { names, db } = await getCtx();
  const t = (await props.searchParams).type;
  const type = LIST_TYPES.some((x) => x.key === t) ? (t as string) : "all";
  const items = await db.listItem.findMany({
    where: type === "all" ? {} : { type },
    orderBy: { createdAt: "desc" },
  });
  items.sort((a, b) => Number(!!a.doneAt) - Number(!!b.doneAt));

  return (
    <>
      <PageHead emoji="🍿" title="Хамтын жагсаалт" sub="Хамт үзэх кино, сонсох дуу, унших ном, очих газар…" />

      <form action={addListItem} className="card">
        <div className="cols3">
          <label className="field">
            <span>Төрөл</span>
            <select name="type" defaultValue={type === "all" ? "movie" : type}>
              {LIST_TYPES.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.emoji} {x.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Нэр</span>
            <input name="title" maxLength={120} required placeholder="Жишээ нь: Interstellar" />
          </label>
          <label className="field">
            <span>Холбоос (заавал биш)</span>
            <input name="url" type="url" placeholder="https://…" />
          </label>
        </div>
        <div className="row end">
          <SubmitButton>Нэмэх</SubmitButton>
        </div>
      </form>

      <Tabs
        items={[["all", "Бүгд"], ...LIST_TYPES.map((x) => [x.key, `${x.emoji} ${x.label}`] as const)]}
        current={type}
        href={(k) => (k === "all" ? "/lists" : `/lists?type=${k}`)}
      />

      {items.length ? (
        <ul className="check-list">
          {items.map((x) => {
            const lt = listTypeOf(x.type);
            return (
              <li key={x.id} className={`check-item${x.doneAt ? " done" : ""}`}>
                <form action={toggleListItem.bind(null, x.id)}>
                  <SubmitButton className="cbox" aria-label={lt.done} title={lt.done}>
                    {x.doneAt ? "✓" : ""}
                  </SubmitButton>
                </form>
                <span className="idea-emoji" aria-hidden="true">
                  {lt.emoji}
                </span>
                <div className="grow">
                  <div className="t">
                    {x.url ? (
                      <a href={x.url} target="_blank" rel="noopener noreferrer">
                        {x.title} ↗
                      </a>
                    ) : (
                      x.title
                    )}
                  </div>
                  <div className="small muted">
                    {lt.label} · {names[x.by as Who]} нэмсэн
                    {x.doneAt && ` · ${lt.done} ✓`}
                  </div>
                </div>
                <form action={deleteListItem.bind(null, x.id)}>
                  <SubmitButton className="icon-btn" confirm="Жагсаалтаас хасах уу?" aria-label="Устгах">
                    <Icon name="trash" size={17} />
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty emoji="🍿">Жагсаалт хоосон байна.</Empty>
      )}
    </>
  );
}
