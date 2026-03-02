/**
 * Generic fallback UI when data fails to load or is unavailable.
 * Use for API errors, empty states, or dev-mode scenarios.
 */
import { AlertCircle } from "lucide-react";

interface DataFallbackProps {
  title?: string;
  message?: string;
  className?: string;
  "data-testid"?: string;
}

export function DataFallback({
  title = "Unable to load",
  message = "Something went wrong. Please try again or refresh the page.",
  className = "",
  "data-testid": testId = "data-fallback",
}: DataFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground ${className}`}
      data-testid={testId}
    >
      <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-3" />
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-muted-foreground/90">{message}</p>
    </div>
  );
}
