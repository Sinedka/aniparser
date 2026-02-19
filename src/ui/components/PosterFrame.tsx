import "./PosterFrame.css";
import { CSSProperties, ReactNode } from "react";

type PosterFrameProps = {
  src: string;
  alt: string;
  status?: string | null;
  className?: string;
  imgClassName?: string;
  radius?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  children?: ReactNode;
};

export default function PosterFrame({
  src,
  alt,
  status,
  className,
  imgClassName,
  radius,
  loading,
  decoding,
  children,
}: PosterFrameProps) {
  return (
    <div
      className={`poster-frame${className ? ` ${className}` : ""}`}
      data-status={status ?? undefined}
      style={radius ? ({ ["--poster-radius"]: radius } as CSSProperties) : undefined}
    >
      <div className="poster-frame-media">
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          className={`poster-frame-img${imgClassName ? ` ${imgClassName}` : ""}`}
        />
        {children}
      </div>
    </div>
  );
}
