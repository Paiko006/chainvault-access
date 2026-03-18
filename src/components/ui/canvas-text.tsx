"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useCallback } from "react";

interface CanvasTextProps {
  text: string;
  className?: string;
  backgroundClassName?: string;
  colors?: string[];
  animationDuration?: number;
  lineWidth?: number;
  lineGap?: number;
  curveIntensity?: number;
  overlay?: boolean;
}

function resolveColor(color: string): string {
  if (color.startsWith("var(")) {
    const varName = color.slice(4, -1).trim();
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    return resolved || color;
  }
  return color;
}

export function CanvasText({
  text,
  className = "",
  backgroundClassName = "bg-white dark:bg-neutral-950",
  colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9"],
  animationDuration = 5,
  lineWidth = 1.5,
  lineGap = 10,
  curveIntensity = 60,
  overlay = false,
}: CanvasTextProps) {
  const colorsRef = useRef<string[]>([]);
  const textRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  // State for things that affect layout
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Refs for values used in the animation loop to avoid restarts
  const stateRef = useRef({
    text,
    font: "",
    bgColor: "#000",
    colors: [] as string[],
    dimensions: { width: 0, height: 0 }
  });

  // Track prop changes
  useEffect(() => {
    stateRef.current.text = text;
    stateRef.current.colors = colors.map(resolveColor);
  }, [text, colors]);

  // Handle color & theme changes
  const updateStyles = useCallback(() => {
    if (bgRef.current) {
      const computed = window.getComputedStyle(bgRef.current);
      stateRef.current.bgColor = computed.backgroundColor;
    }
    stateRef.current.colors = colors.map(resolveColor);
  }, [colors]);

  useEffect(() => {
    updateStyles();
    const observer = new MutationObserver(updateStyles);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [updateStyles]);

  // Handle dimensions
  useEffect(() => {
    const textEl = textRef.current;
    if (!textEl) return;

    const updateDimensions = () => {
      const rect = textEl.getBoundingClientRect();
      const computed = window.getComputedStyle(textEl);
      const newDims = {
        width: Math.ceil(rect.width) || 400,
        height: Math.ceil(rect.height) || 200,
      };
      setDimensions(newDims);
      stateRef.current.dimensions = newDims;
      stateRef.current.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(textEl);
    return () => resizeObserver.disconnect();
  }, [text, className]);

  // Main Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const { text: currentText, font, bgColor, colors: currentColors, dimensions: currentDims } = stateRef.current;
      
      if (!font || currentColors.length === 0 || currentDims.width === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const { width, height } = currentDims;
      const dpr = window.devicePixelRatio || 1;

      // Update canvas size if needed
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const phase = (elapsed / animationDuration) * Math.PI * 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Draw text mask
      ctx.globalCompositeOperation = "source-over";
      ctx.font = font;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      
      // Measure baseline
      const metrics = ctx.measureText(currentText);
      const ascent = metrics.actualBoundingBoxAscent;
      const descent = metrics.actualBoundingBoxDescent;
      const baselineY = (height + ascent - descent) / 2;

      ctx.fillStyle = "#000";
      ctx.fillText(currentText, 0, baselineY);

      // Fill background
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Draw animated lines
      ctx.globalCompositeOperation = "source-atop";
      const numLines = Math.floor(height / lineGap) + 10;
      
      for (let i = 0; i < numLines; i++) {
        const y = i * lineGap;
        const curve1 = Math.sin(phase) * curveIntensity;
        const curve2 = Math.sin(phase + 0.5) * curveIntensity * 0.6;

        const colorIndex = i % currentColors.length;
        ctx.strokeStyle = currentColors[colorIndex];
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          width * 0.33,
          y + curve1,
          width * 0.66,
          y + curve2,
          width,
          y,
        );
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animationDuration, lineWidth, lineGap, curveIntensity]);


  return (
    <span
      className={cn(
        "relative inline-block",
        overlay && "absolute inset-0",
        className,
      )}
    >
      <span
        ref={bgRef}
        className={cn(
          "pointer-events-none absolute h-0 w-0 opacity-0",
          backgroundClassName,
        )}
        aria-hidden="true"
      />
      <span ref={textRef} className="invisible inline-block" aria-hidden="true">
        {text}
      </span>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute top-0 left-0"
        style={{
          width: dimensions.width || "auto",
          height: dimensions.height || "auto",
        }}
        aria-label={text}
        role="img"
      />
    </span>
  );
}
