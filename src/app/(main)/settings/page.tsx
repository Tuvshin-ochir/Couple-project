import type { Metadata } from "next";
import Avatar from "@/components/Avatar";
import AppSetup from "@/components/AppSetup";
import BackgroundPicker from "@/components/BackgroundPicker";
import AvatarUploader from "@/components/AvatarUploader";
import DeleteCouple from "@/components/DeleteCouple";
import InviteLink from "@/components/InviteLink";
import LogoutButton from "@/components/LogoutButton";
import PasswordForm from "@/components/PasswordForm";
import ProfileForm from "@/components/ProfileForm";
import ThemePicker from "@/components/ThemePicker";
import { PageHead } from "@/components/ui";
import { parseBg } from "@/lib/backgrounds";
import { getCtx } from "@/lib/ctx";
import { vapidPublicKey } from "@/lib/push";
import { utcKey } from "@/lib/time";

export const metadata: Metadata = { title: "Тохиргоо" };

export default async function SettingsPage() {
  const { s, me, names, avatars, cityA, cityB } = await getCtx();

  return (
    <>
      <PageHead icon="settings" title="Тохиргоо" sub="Бидний тухай мэдээлэл, профайл зураг, өнгө, нууц үг." />

      <section className="card">
        <h2>Хосын нэр: {s.handle}</h2>
        <p className="small muted">Хайртдаа энэ холбоосыг илгээгээрэй — орж ирээд өөрийгөө сонгож, хосын нууц үгээр нэвтэрнэ.</p>
        <InviteLink handle={s.handle} />
      </section>

      <section className="card">
        <h2>Профайл зураг</h2>
        <div className="avatar-row">
          <AvatarUploader who="a" name={names.a} has={!!avatars.a} />
          <span className="avatar-amp" aria-hidden="true">
            &amp;
          </span>
          <AvatarUploader who="b" name={names.b} has={!!avatars.b} />
        </div>
      </section>

      <AppSetup vapidKey={vapidPublicKey()} />

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
        <h3 className="sub-h">Арын өнгө</h3>
        <p className="small muted">Товч, карт, текст бүгд энэ өнгийг дагана. Хоёулаа ижилхэн харна — аль нэг нь солиход нөгөөгийнх нь дэлгэц дээр ч солигдоно.</p>
        <BackgroundPicker value={parseBg(s.bg)} />
      </section>

      <PasswordForm />

      <section className="card">
        <h2>Нөөц</h2>
        <p className="small muted">
          Бүх өгөгдлөө (зурагтай нь) JSON файлаар татаж аваарай. Нууц өрөөний агуулга нөөцөд ордоггүй.
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
        <LogoutButton className="btn line">Гарах</LogoutButton>
      </section>

      <section className="card danger-zone">
        <h2>Аюултай бүс</h2>
        <DeleteCouple />
      </section>
    </>
  );
}
