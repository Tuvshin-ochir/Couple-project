import type { Metadata } from "next";
import { logout } from "@/app/actions";
import Avatar from "@/components/Avatar";
import AvatarUploader from "@/components/AvatarUploader";
import PasswordForm from "@/components/PasswordForm";
import ProfileForm from "@/components/ProfileForm";
import ThemePicker from "@/components/ThemePicker";
import { PageHead } from "@/components/ui";
import { getCtx } from "@/lib/ctx";
import { utcKey } from "@/lib/time";

export const metadata: Metadata = { title: "Тохиргоо" };

export default async function SettingsPage() {
  const { s, me, names, avatars, cityA, cityB } = await getCtx();

  return (
    <>
      <PageHead emoji="⚙️" title="Тохиргоо" sub="Бидний тухай мэдээлэл, профайл зураг, өнгө, нууц үг." />

      <section className="card">
        <h2>Профайл зураг</h2>
        <div className="avatar-row">
          <AvatarUploader who="a" name={names.a} has={!!avatars.a} />
          <span className="avatar-heart" aria-hidden="true">
            ❤
          </span>
          <AvatarUploader who="b" name={names.b} has={!!avatars.b} />
        </div>
      </section>

      <ProfileForm
        names={names}
        startDate={s.startDate ? utcKey(s.startDate) : ""}
        nextMeet={s.nextMeet?.toISOString() ?? null}
        cityA={cityA}
        cityB={cityB}
      />

      <section className="card">
        <h2>Өнгө</h2>
        <ThemePicker />
      </section>

      <PasswordForm />

      <section className="card">
        <h2>Нөөц</h2>
        <p className="small muted">
          Бүх өгөгдлөө (зурагтай нь) JSON файлаар татаж аваарай. Өгөгдлийн сан өөрөө <code>prisma/dev.db</code> файлд
          хадгалагддаг.
        </p>
        <a className="btn line" href="/api/export" download>
          Нөөц татах (JSON)
        </a>
      </section>

      <section className="card row between">
        <div className="row">
          <Avatar who={me} name={names[me]} />
          <div>
            <b>{names[me]}</b>
            <div className="small muted">энэ төхөөрөмж дээр нэвтэрсэн</div>
          </div>
        </div>
        <form action={logout}>
          <button className="btn line">Гарах</button>
        </form>
      </section>
    </>
  );
}
