"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";

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
  /**
   * When set, the confirm button stays disabled until the admin types this
   * exact phrase — used for irreversible actions like permanent deletion.
   */
  requireConfirmationText?: string;
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
  requireConfirmationText,
}: ConfirmDialogProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  // Reset the typed confirmation whenever the dialog transitions closed.
  // Done during render (not an effect) to avoid an extra commit/cascade.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setTypedConfirmation("");
    }
  }

  const confirmationSatisfied =
    !requireConfirmationText || typedConfirmation.trim() === requireConfirmationText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[420px] rounded-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireConfirmationText ? (
          <div className="space-y-1.5">
            <p className="text-center text-xs text-text-tertiary">
              Type <span className="font-semibold text-text-primary">{requireConfirmationText}</span> to
              confirm this action.
            </p>
            <Input
              autoFocus
              value={typedConfirmation}
              onChange={(event) => setTypedConfirmation(event.target.value)}
              placeholder={requireConfirmationText}
              className="text-center"
            />
          </div>
        ) : null}

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
            disabled={loading || !confirmationSatisfied}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
