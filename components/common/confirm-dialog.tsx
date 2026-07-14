"use client";

import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
  confirmVariant?: "default" | "destructive";
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  loading = false,
  confirmVariant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[420px] rounded-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
          <Button
            variant="outline"
            className="min-w-[124px]"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            className="min-w-[124px]"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}