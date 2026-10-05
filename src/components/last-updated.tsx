import { CalendarDays } from "lucide-react";

// Edit this date whenever you ship an update (YYYY-MM-DD)
const LAST_UPDATED = "2026-10-05";

export function LastUpdated() {
  const date = new Date(`${LAST_UPDATED}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <CalendarDays className="size-4" />
      <span>
        Last update:{" "}
        <time dateTime={LAST_UPDATED} className="font-semibold tabular-nums text-foreground">
          {date}
        </time>
      </span>
    </div>
  );
}

export default LastUpdated;
