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
      <div role="alert" className="flex h-full min-h-[60px] w-full items-center justify-center gap-1.5 rounded-xl bg-rose-50 p-2 text-center text-xs font-semibold text-[#b4232d]">
        <WarningCircle size={16} aria-hidden="true" className="shrink-0" />
        <span className="truncate">Không thể tải ảnh</span>
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className="flex h-full min-h-[60px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#f8f6fa] p-2 text-xs font-semibold text-[#746A6E]" aria-label="Đang tải ảnh xem trước">
        <SpinnerGap size={16} className="animate-spin shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">Đang tải...</span>
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}
