"use client";

import { useEffect, useState } from "react";
import { apiBlob } from "@/lib/api";

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
    void apiBlob(fileUrl)
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [fileUrl]);

  if (failed || !objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} />;
}
