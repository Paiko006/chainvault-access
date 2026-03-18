"use client";
import { cn } from "@/lib/utils";
import { CanvasText } from "@/components/ui/canvas-text";

export default function CanvasTextDemo() {
  return (
    <div className="flex min-h-80 items-center justify-center p-8">
      <h2
        className={cn(
          "group relative mx-auto mt-4 max-w-2xl text-center text-5xl leading-20 font-bold tracking-tight text-balance text-neutral-600 sm:text-6xl md:text-7xl xl:text-8xl dark:text-neutral-700",
        )}
      >
        <CanvasText
          text="ShelbySecure"
          backgroundClassName="bg-primary dark:bg-primary"
          colors={[
            "rgba(0, 153, 255, 1)",
            "rgba(0, 255, 200, 0.9)",
            "rgba(0, 153, 255, 0.8)",
            "rgba(0, 255, 200, 0.7)",
            "rgba(0, 153, 255, 0.6)",
            "rgba(0, 255, 200, 0.5)",
            "rgba(0, 153, 255, 0.4)",
            "rgba(0, 255, 200, 0.3)",
            "rgba(0, 153, 255, 0.2)",
            "rgba(0, 255, 200, 0.1)",
          ]}
          lineGap={4}
          animationDuration={15}
        />
      </h2>

    </div>
  );
}
