"use client";

import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";

interface ShareableCardData {
  type: "pr" | "achievement" | "weekly";
  title: string;
  subtitle?: string;
  value?: string;
  improvement?: string;
  date?: string;
}

export function useShareCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const generateShareImage = useCallback(async (cardElement: HTMLElement): Promise<Blob | null> => {
    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: "#0D0D0D",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });
    } catch (error) {
      console.error("Failed to generate share image:", error);
      return null;
    }
  }, []);

  const shareToSocial = useCallback(async (
    data: ShareableCardData,
    cardElement?: HTMLElement | null
  ) => {
    const shareText = data.type === "pr" 
      ? `New ${data.title} PR: ${data.value}! ${data.improvement ? `(${data.improvement} faster!)` : ""}`
      : data.type === "achievement"
        ? `Just unlocked: ${data.title}!`
        : `Weekly Stats: ${data.value}`;
    
    const shareData: ShareData = {
      title: "Runner Wellness Bot",
      text: shareText,
      url: window.location.origin,
    };

    // Try native share first (mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        // If we have a card element, try to share the image too
        if (cardElement) {
          const blob = await generateShareImage(cardElement);
          if (blob) {
            const file = new File([blob], "achievement.png", { type: "image/png" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ ...shareData, files: [file] });
              return true;
            }
          }
        }
        await navigator.share(shareData);
        return true;
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
        return false;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${window.location.origin}`);
      return true;
    } catch {
      return false;
    }
  }, [generateShareImage]);

  const downloadShareImage = useCallback(async (
    cardElement: HTMLElement,
    filename: string = "achievement.png"
  ) => {
    const blob = await generateShareImage(cardElement);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }
    return false;
  }, [generateShareImage]);

  return {
    cardRef,
    shareToSocial,
    downloadShareImage,
    generateShareImage,
  };
}
