"use client";

import { useEffect, useRef } from "react";
import { Calendar, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DateRangeFilterProps = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  open,
  onOpenChange,
  className = "relative min-w-[130px]",
}: DateRangeFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  return (
    <div className={className} ref={containerRef}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex h-9 w-full items-center gap-1.5 rounded-lg border border-border bg-card pl-2.5 pr-2.5 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-secondary-bg focus:border-primary"
      >
        <Calendar className="size-3.5 shrink-0 text-slate-600 dark:text-slate-200" />
        <span className="flex-1 truncate text-left">
          {dateFrom || dateTo ? `${dateFrom || "…"} – ${dateTo || "…"}` : "Date Range"}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-slate-500 dark:text-slate-300" />
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1.5 w-[260px] rounded-lg border border-border bg-card p-3 shadow-lg">
          <div className="space-y-2.5">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-tertiary">From</label>
              <Input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-border bg-card px-2.5 text-xs text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-tertiary">To</label>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => onDateToChange(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-border bg-card px-2.5 text-xs text-text-primary"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={onClear}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 flex-1 bg-teal-600 text-xs text-white hover:bg-teal-700"
              onClick={() => onOpenChange(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
