"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import { OpenStreetMapPicker } from "@/components/dashboard/open-street-map-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LocationItem } from "@/types/api";

const DEFAULT_LATITUDE = 23.8103;
const DEFAULT_LONGITUDE = 90.4125;

type LocationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: LocationItem | null;
  onSubmit: (payload: { name: string; latitude: number; longitude: number }) => void;
  loading: boolean;
};

export function LocationFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  loading,
}: LocationFormDialogProps) {
  // Callers remount this dialog via a `key`, so initial state is seeded once.
  const [name, setName] = useState(initialValues?.name ?? "");
  const [latitude, setLatitude] = useState(
    initialValues ? String(initialValues.latitude) : ""
  );
  const [longitude, setLongitude] = useState(
    initialValues ? String(initialValues.longitude) : ""
  );

  const isEditing = Boolean(initialValues);

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const mapLatitude =
    latitude !== "" && Number.isFinite(parsedLatitude) ? parsedLatitude : DEFAULT_LATITUDE;
  const mapLongitude =
    longitude !== "" && Number.isFinite(parsedLongitude) ? parsedLongitude : DEFAULT_LONGITUDE;

  const isValid =
    name.trim() !== "" &&
    latitude !== "" &&
    longitude !== "" &&
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[620px] overflow-y-auto rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">
            {isEditing ? "Edit Location" : "Add New Location"}
          </DialogTitle>
          <p className="text-xs text-text-tertiary">
            Name this location and set the coordinates users check in against.
          </p>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (!isValid) return;

            onSubmit({
              name: name.trim(),
              latitude: parsedLatitude,
              longitude: parsedLongitude,
            });
          }}
        >
          <div>
            <Label className="mb-1.5 block text-xs text-text-tertiary">Location Name</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
              <Input
                autoFocus
                required
                placeholder="e.g. Main Gate"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-text-tertiary">Latitude</Label>
              <Input
                required
                placeholder="Latitude"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-text-tertiary">Longitude</Label>
              <Input
                required
                placeholder="Longitude"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-text-tertiary">
              Pick on map
            </Label>
            <OpenStreetMapPicker
              latitude={mapLatitude}
              longitude={mapLongitude}
              onChange={(nextLatitude, nextLongitude) => {
                setLatitude(String(nextLatitude));
                setLongitude(String(nextLongitude));
              }}
            />
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
              disabled={loading || !isValid}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditing ? "Save Changes" : "Add Location"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
