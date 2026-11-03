import type { Metadata } from "next";
import MusicPlayer from "@/components/MusicPlayer";
import SongAdd from "@/components/SongAdd";
import { PageHead } from "@/components/ui";
import { getCtx } from "@/lib/ctx";
import { rel } from "@/lib/time";
import type { Who } from "@/lib/types";

export const metadata: Metadata = { title: "Our taste" };

export default async function MusicPage() {
  const { db, me, names, tz } = await getCtx();
  // Playlist нь нэмсэн дарааллаараа (шинэ дуу төгсгөлд)
  const songs = await db.song.findMany({ orderBy: { createdAt: "asc" } });
  const now = new Date();

  return (
    <>
      <PageHead icon="music" title="Our taste" sub="Хоёулангийн playlist — дуугаа нэрээр нь хайж нэмээд, эндээс шууд сонсоорой." />
      <SongAdd have={songs.map((s) => s.videoId)} />
      <MusicPlayer
        tracks={songs.map((s) => ({
          id: s.id,
          videoId: s.videoId,
          title: s.title,
          author: s.author,
          note: s.note,
          by: s.by as Who,
          byName: names[s.by as Who],
          when: rel(s.createdAt, tz, now),
          liked: me === "a" ? s.likedA : s.likedB,
          likes: Number(s.likedA) + Number(s.likedB),
        }))}
      />
    </>
  );
}
