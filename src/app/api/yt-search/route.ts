import { connection, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth";

export type YtResult = { id: string; title: string; author: string; duration: string };

type Runs = { runs?: { text?: string }[]; simpleText?: string };
type VideoRenderer = { videoId?: string; title?: Runs; ownerText?: Runs; longBylineText?: Runs; lengthText?: Runs };

const text = (r?: Runs) => r?.simpleText ?? r?.runs?.map((x) => x.text ?? "").join("") ?? "";

/** ytInitialData дотроос videoRenderer-үүдийг дарааллаар нь цуглуулна (бүтэц нь гүн, байнга өөрчлөгддөг) */
function collect(node: unknown, out: VideoRenderer[]) {
  if (!node || typeof node !== "object" || out.length >= 30) return;
  if (Array.isArray(node)) {
    for (const x of node) collect(x, out);
    return;
  }
  const o = node as Record<string, unknown>;
  if (o.videoRenderer) {
    out.push(o.videoRenderer as VideoRenderer);
    return;
  }
  for (const k in o) collect(o[k], out);
}

// YouTube-ээс дууг нэрээр нь хайна. Data API түлхүүргүйгээр хайлтын хуудасны
// өгөгдлийг уншдаг тул YouTube бүтцээ өөрчилбөл хоосон буцааж, клиент холбоосоор нэмэхийг санал болгоно.
export async function GET(req: NextRequest) {
  await connection();
  if (!(await readSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  if (!q) return Response.json({ results: [] });

  try {
    const r = await fetch(`https://www.youtube.com/results?hl=en&gl=MN&search_query=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "SOCS=CAI", // ЕХ-ны зөвшөөрлийн хуудсыг алгасна
      },
      signal: AbortSignal.timeout(6000),
    });
    const html = await r.text();
    const json = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/)?.[1];
    if (!r.ok || !json) throw new Error(`YouTube ${r.status}`);

    const found: VideoRenderer[] = [];
    collect(JSON.parse(json), found);
    const results: YtResult[] = found
      // Шууд дамжуулалт (урт хугацаагүй) тоглуулах жагсаалтад тохирохгүй
      .filter((v) => v.videoId && v.lengthText)
      .slice(0, 8)
      .map((v) => ({
        id: v.videoId!,
        title: text(v.title).slice(0, 150),
        author: text(v.ownerText ?? v.longBylineText).slice(0, 80),
        duration: text(v.lengthText),
      }));
    return Response.json({ results });
  } catch {
    return Response.json({ results: [], error: "Хайлт түр ажиллахгүй байна — YouTube холбоосоо хуулж оруулна уу" }, { status: 502 });
  }
}
