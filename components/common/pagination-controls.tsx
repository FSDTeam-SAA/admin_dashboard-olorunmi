"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildPagination, cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  className?: string;
};

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const pages = buildPagination(page, totalPages);

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      <Button
        variant="secondary"
        size="icon"
        className="size-9"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((item) => (
        <Button
          key={item}
          variant={item === page ? "default" : "secondary"}
          size="icon"
          className="size-9"
          onClick={() => onPageChange(item)}
        >
          {item}
        </Button>
      ))}

      <Button
        variant="secondary"
        size="icon"
        className="size-9"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}