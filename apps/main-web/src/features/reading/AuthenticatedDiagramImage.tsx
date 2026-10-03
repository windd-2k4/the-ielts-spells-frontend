"use client";

import { useEffect, useState } from "react";
import { SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { apiMediaUrl, revokeMediaUrl } from "@/lib/api";

interface AuthenticatedDiagramImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackText?: string;
}

export function AuthenticatedDiagramImage({
  src,
  alt = "Sơ đồ bài thi",
  className = "",
  fallbackText,
}: AuthenticatedDiagramImageProps) {
  const [objectUrl, setObjectUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setFailed(true);
      return;
    }

    if (src.startsWith("data:") || src.startsWith("blob:")) {
      setObjectUrl(src);
      setLoading(false);
      setFailed(false);
      return;
    }

    let active = true;
    let createdUrl = "";
    setLoading(true);
    setFailed(false);

    apiMediaUrl(src)
      .then((url) => {
        if (!active) return;
        createdUrl = url;
        setObjectUrl(createdUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Không thể tải sơ đồ/hình ảnh:", err);
        if (active) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (createdUrl) {
        revokeMediaUrl(createdUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div
        className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 py-6 text-slate-500"
        role="status"
        aria-label="Đang tải sơ đồ"
      >
        <SpinnerGap size={28} className="animate-spin text-slate-400" aria-hidden="true" />
        <span className="text-xs font-semibold text-slate-500">Đang tải sơ đồ...</span>
      </div>
    );
  }

  if (failed || !objectUrl) {
    return (
      <div
        className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 py-6 text-slate-500"
        role="alert"
      >
        <WarningCircle size={28} className="text-amber-500" aria-hidden="true" />
        <span className="text-xs font-semibold text-slate-600">
          {fallbackText || `Không thể tải ảnh sơ đồ (${alt})`}
        </span>
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}
