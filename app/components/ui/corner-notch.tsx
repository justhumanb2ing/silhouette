import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type CornerNotchProps = {
  size?: number;
  radius?: number;
  fillColor?: string;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

/**
 * Concave corner notch used to "cut" the top-left of a surface.
 * Render with the same fill color as the surrounding background.
 */
export function CornerNotch({
  size = 96,
  radius = 36,
  fillColor = "#050505",
  className,
  ...rest
}: CornerNotchProps) {
  const clampedRadius = Math.min(radius, size);
  const path = [
    `M0 0 H ${size} V ${size} H 0 Z`, // outer square
    `M0 0 L ${clampedRadius} 0 A ${clampedRadius} ${clampedRadius} 0 0 1 0 ${clampedRadius} Z`, // cut-out quarter circle
  ].join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(
        "drop-shadow-[0_18px_55px_rgba(0,0,0,0.45)] transition-transform duration-500",
        className
      )}
      {...rest}
    >
      <path d={path} fill={fillColor} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}
