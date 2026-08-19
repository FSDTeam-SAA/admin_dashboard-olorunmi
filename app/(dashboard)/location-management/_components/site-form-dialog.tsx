"use client";

import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SiteItem } from "@/types/api";

type SiteFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: SiteItem | null;
  onSubmit: (payload: { name: string }) => void;
  loading: boolean;
};

export function SiteFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  loading,
}: SiteFormDialogProps) {
  // Callers remount this dialog via a `key`, so initial state is seeded once.
  const [name, setName] = useState(initialValues?.name ?? "");

  const isEditing = Boolean(initialValues);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">
            {isEditing ? "Edit Site" : "Add New Site"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ name: name.trim() });
          }}
        >
          <div>
            <Label className="mb-1.5 block text-xs text-text-tertiary">Site Name</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
              <Input
                autoFocus
                required
                placeholder="e.g. Regal Head Office"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="min-w-[110px]"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-[110px] bg-blue-600 text-white hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              disabled={loading || !name.trim()}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditing ? "Save Changes" : "Create Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
