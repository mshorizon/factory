import { useState } from "react";

// Gray gradient placeholder — shown when image fails to load
const FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e2e8f0'/%3E%3Cstop offset='100%25' stop-color='%23cbd5e1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23g)'/%3E%3C/svg%3E";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  alt: string;
  fallback?: string;
}

export function SafeImage({ src, alt, fallback = FALLBACK, onError, ...props }: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!errored) {
      setErrored(true);
      e.currentTarget.src = fallback;
    }
    if (onError) onError(e);
  };

  return (
    <img
      src={errored ? fallback : (src || fallback)}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
}
