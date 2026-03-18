"use client";
import { cn } from "@/lib/utils";
import { CanvasText } from "@/components/ui/canvas-text";

export default function CanvasTextDemo() {
  return (
    <div className="flex min-h-80 items-center justify-center bg-transparent p-8">
      <CanvasText
        text="ShelbySecure"
        className="text-4xl font-bold md:text-6xl lg:text-8xl"
        backgroundClassName="bg-black dark:bg-neutral-700"
        colors={[
          "var(--color-blue-500)",
          "var(--color-sky-500)",
          "var(--color-violet-500)",
          "var(--color-teal-500)",
        ]}
        lineGap={6}
        animationDuration={10}
      />
    </div>
  );
}
