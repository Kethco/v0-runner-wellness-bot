"use client";

interface BrandLogoProps {
  variant?: "full" | "compact" | "icon";
  theme?: "light" | "dark" | "orange";
  className?: string;
}

export function BrandLogo({ 
  variant = "full", 
  theme = "dark",
  className = "" 
}: BrandLogoProps) {
  const colors = {
    light: { primary: "#FFFFFF", secondary: "rgba(255,255,255,0.7)", accent: "rgba(255,255,255,0.4)" },
    dark: { primary: "#FFFFFF", secondary: "rgba(255,255,255,0.7)", accent: "rgba(255,255,255,0.3)" },
    orange: { primary: "#FF4500", secondary: "#FF6B35", accent: "rgba(255,69,0,0.3)" }
  };
  
  const { primary, secondary, accent } = colors[theme];

  if (variant === "icon") {
    // Just the "RW" monogram
    return (
      <svg 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Runner Wellness"
      >
        <text
          x="20"
          y="27"
          textAnchor="middle"
          fill={primary}
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontWeight="600"
          fontSize="18"
          letterSpacing="0.02em"
        >
          RW
        </text>
      </svg>
    );
  }

  if (variant === "compact") {
    // Single line: RUNNER WELLNESS
    return (
      <svg 
        viewBox="0 0 200 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Runner Wellness"
      >
        <text
          x="100"
          y="17"
          textAnchor="middle"
          fill={primary}
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontWeight="600"
          fontSize="14"
          letterSpacing="0.2em"
        >
          RUNNER WELLNESS
        </text>
      </svg>
    );
  }

  // Full stacked logo with accent line
  return (
    <svg 
      viewBox="0 0 280 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Runner Wellness"
    >
      {/* RUNNER - Premium refined typography */}
      <text
        x="140"
        y="28"
        textAnchor="middle"
        fill={primary}
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="600"
        fontSize="26"
        letterSpacing="0.18em"
      >
        RUNNER
      </text>
      
      {/* WELLNESS - Lighter weight for elegant hierarchy */}
      <text
        x="140"
        y="52"
        textAnchor="middle"
        fill={secondary}
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="300"
        fontSize="18"
        letterSpacing="0.35em"
      >
        WELLNESS
      </text>
      
      {/* Subtle accent line between words */}
      <rect
        x="95"
        y="33"
        width="90"
        height="1"
        fill={accent}
      />
    </svg>
  );
}

// Simple text logo for headers where SVG isn't needed
export function BrandLogoText({ 
  className = "",
  size = "default"
}: { 
  className?: string;
  size?: "small" | "default" | "large";
}) {
  const sizes = {
    small: "text-base",
    default: "text-xl",
    large: "text-2xl"
  };
  
  return (
    <span className={`font-semibold tracking-wide ${sizes[size]} ${className}`}>
      <span className="text-[#FF4500]">Runner</span>
      <span className="text-white/80 font-light ml-1">Wellness</span>
    </span>
  );
}
