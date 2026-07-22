import { ReactNode } from "react";

/**
 * The base surface used across the Signal Laboratory: sharp corners, hard
 * 1-2px borders, no radius, no shadow-blur glow. A hard-edged offset shadow
 * (not a blur) stands in for elevation on hover. Optional clipped corner tab
 * (a small diagonal notch) to evoke a lab specimen card.
 */
export function ClippedPanel({
  children,
  className = "",
  clipCorner = false,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  clipCorner?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={`${interactive ? "card-interactive" : "card"} ${className}`}
      style={
        clipCorner
          ? { clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" }
          : undefined
      }
    >
      {children}
    </div>
  );
}
