import "./PosterFrame.css";
import { CSSProperties, ReactNode } from "react";

type PosterFrameProps = {
  src: string;
  alt: string;
  status?: number | null;
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
  const statusString = status === 1
    ? "planned"
    : status === 2
      ? "watching"
      : status === 3
        ? "completed"
        : status === 5
          ? "dropped"
          : undefined;


  return (
    <div
      className={`poster-frame${className ? ` ${className}` : ""}`}
      data-status={statusString ?? undefined}
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
