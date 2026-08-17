"use client";

import { Button } from "@/components/ui/button";
import { buildPagination, cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  className?: string;
  showTextLabels?: boolean;
};

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  className,
  showTextLabels = true,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPagination(page, totalPages);

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}>
      <Button
        variant="outline"
        size="sm"
        className="h-8.5 rounded-md px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {showTextLabels ? "« Prev" : "Prev"}
      </Button>

      {pages.map((item, index) => {
        if (typeof item === "string") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex size-8.5 items-center justify-center text-xs text-text-tertiary"
            >
              ...
            </span>
          );
        }

        const isActive = item === page;

        return (
          <Button
            key={item}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "size-8.5 min-w-[34px] rounded-md px-0 text-xs font-semibold",
              isActive
                ? "bg-blue-600 text-white shadow-xs hover:bg-blue-700"
                : "border-border bg-card text-text-secondary hover:bg-secondary-bg hover:text-text-primary"
            )}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        className="h-8.5 rounded-md px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {showTextLabels ? "Next »" : "Next"}
      </Button>
    </div>
  );
}