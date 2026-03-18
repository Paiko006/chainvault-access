"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { CanvasText } from "@/components/ui/canvas-text";

export default function CanvasTextDemo() {
  const brandColors = React.useMemo(() => [
    "#3b82f6", // Blue 500
    "#0ea5e9", // Sky 500
    "#8b5cf6", // Violet 500
    "#14b8a6", // Teal 500
  ], []);

  return (
    <div className="flex min-h-80 items-center justify-center bg-transparent p-8">
      <CanvasText
        text="ShelbySecure"
        className="text-4xl font-bold md:text-6xl lg:text-8xl"
        backgroundClassName="bg-black dark:bg-neutral-700"
        colors={brandColors}
        lineGap={6}
        animationDuration={10}
      />
    </div>
  );
}
