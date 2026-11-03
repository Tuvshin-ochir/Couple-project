// Ачааллын төлөвүүд — бодит апп шиг тайван

import { Wordmark } from "./Brand";

/** Апп анх нээгдэх үед (нэвтрэлт шалгаж байх хооронд) */
export function BootLoader() {
  return (
    <div className="boot" role="status" aria-label="Ачаалж байна">
      <Wordmark size={20} animated />
    </div>
  );
}

/** Хуудас хооронд шилжих үед — агуулгын хэлбэрийг урьдчилан харуулна */
export function PageSkeleton() {
  return (
    <div className="skel-page" role="status" aria-label="Ачаалж байна">
      <div className="skel-head">
        <span className="skel skel-ico" />
        <div className="skel-lines">
          <span className="skel skel-line w45" />
          <span className="skel skel-line thin w70" />
        </div>
      </div>
      <div className="skel-grid">
        <span className="skel skel-card tall" />
        <span className="skel skel-card" />
        <span className="skel skel-card" />
      </div>
    </div>
  );
}
