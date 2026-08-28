export function ClipForgeLogo({
  compact = false,
  size = "md",
  light = false,
  className = "",
}: {
  compact?: boolean;
  size?: "sm" | "md";
  light?: boolean;
  className?: string;
}) {
  const h = size === "sm" ? "h-7" : "h-9";
  const img = (
    <img
      src="/logo-cf-wide.png"
      alt="ClipForge AI"
      className={`${h} w-auto shrink-0 ${light ? "rounded-lg bg-white p-0.5" : ""}`}
    />
  );
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {img}
      {!compact && (
        <div className="sr-only">ClipForge AI</div>
      )}
    </div>
  );
}
