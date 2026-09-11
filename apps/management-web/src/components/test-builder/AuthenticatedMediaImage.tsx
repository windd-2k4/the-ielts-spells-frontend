import { SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiBlob } from "../../lib/api";

type Props = {
  fileUrl: string;
  alt: string;
  className?: string;
};

export default function AuthenticatedMediaImage({ fileUrl, alt, className = "" }: Props) {
  const [objectUrl, setObjectUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let nextObjectUrl = "";
    setObjectUrl("");
    setFailed(false);

    void apiBlob(fileUrl)
      .then((blob) => {
        if (!active) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [fileUrl]);

  if (failed) {
    return (
      <div role="alert" className="flex min-h-40 items-center justify-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-[#b4232d]">
        <WarningCircle size={18} aria-hidden="true" />
        Không thể tải ảnh xem trước.
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className="flex min-h-40 items-center justify-center gap-2 rounded-xl bg-[#f8f6fa] text-xs font-semibold text-[#746A6E]" aria-label="Đang tải ảnh xem trước">
        <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
        Đang tải ảnh...
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}
