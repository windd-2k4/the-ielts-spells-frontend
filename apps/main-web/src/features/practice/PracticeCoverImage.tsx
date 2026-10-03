"use client";

import { useEffect, useState } from "react";
import { apiMediaUrl, revokeMediaUrl } from "@/lib/api";

interface Props {
  fileUrl: string;
  alt: string;
  className?: string;
}

export function PracticeCoverImage({ fileUrl, alt, className = "" }: Props) {
  const [objectUrl, setObjectUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl = "";
    setObjectUrl("");
    setFailed(false);
    void apiMediaUrl(fileUrl)
      .then((url) => {
        if (!active) return;
        createdUrl = url;
        setObjectUrl(createdUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (createdUrl) revokeMediaUrl(createdUrl);
    };
  }, [fileUrl]);

  if (failed || !objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} />;
}
