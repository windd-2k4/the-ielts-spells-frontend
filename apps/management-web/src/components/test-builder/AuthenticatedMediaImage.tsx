import { SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiMediaUrl, revokeMediaUrl } from "../../lib/api";

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

    void apiMediaUrl(fileUrl)
      .then((url) => {
        if (!active) return;
        nextObjectUrl = url;
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (nextObjectUrl) revokeMediaUrl(nextObjectUrl);
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
