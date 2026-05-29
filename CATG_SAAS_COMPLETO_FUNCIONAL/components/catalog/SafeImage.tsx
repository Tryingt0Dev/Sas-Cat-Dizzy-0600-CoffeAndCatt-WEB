"use client";

import { useState } from "react";

export function SafeImage({
  src,
  fallback,
  alt,
  className
}: {
  src: string | null | undefined;
  fallback: string;
  alt: string;
  className: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallback);
  return <img src={currentSrc} alt={alt} className={className} onError={() => setCurrentSrc(fallback)} />;
}
