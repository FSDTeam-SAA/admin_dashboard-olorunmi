"use client";

import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { IdCard, Lock, Plus, User, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getUserInitials } from "@/lib/utils";
import type { UserListItem } from "@/types/api";

import { OpenStreetMapPicker } from "./open-street-map-picker";

const DEFAULT_LATITUDE = 23.8103;
const DEFAULT_LONGITUDE = 90.4125;

export type UserFormPayload = {
  name: string;
  userId: string;
  password: string;
  latitude: number;
  longitude: number;
  defaultRadius: number;
  profilePhoto?: File | null;
};

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: UserListItem | null;
  onSubmit: (payload: UserFormPayload) => void;
  loading: boolean;
};

export function UserFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  loading,
}: UserFormDialogProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [userId, setUserId] = useState(initialValues?.userId ?? "");
  const [password, setPassword] = useState("");
  const [latitude, setLatitude] = useState(String(initialValues?.location?.latitude ?? DEFAULT_LATITUDE));
  const [longitude, setLongitude] = useState(String(initialValues?.location?.longitude ?? DEFAULT_LONGITUDE));
  const [defaultRadius, setDefaultRadius] = useState(String(initialValues?.defaultRadius ?? 100));
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const previewUrl = useMemo(() => {
    if (!profilePhoto) {
      return null;
    }

    return URL.createObjectURL(profilePhoto);
  }, [profilePhoto]);

  const parsedLatitude = useMemo(() => {
    const value = Number(latitude);
    return Number.isNaN(value) ? DEFAULT_LATITUDE : value;
  }, [latitude]);

  const parsedLongitude = useMemo(() => {
    const value = Number(longitude);
    return Number.isNaN(value) ? DEFAULT_LONGITUDE : value;
  }, [longitude]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[460px] rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle>{initialValues ? "Update user" : "Add New user"}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();

            const latitudeValue = Number(latitude);
            const longitudeValue = Number(longitude);
            const parsedRadius = Number(defaultRadius);

            if (Number.isNaN(latitudeValue) || Number.isNaN(longitudeValue)) {
              toast.error("Latitude and longitude must be valid numbers");
              return;
            }

            if (latitudeValue < -90 || latitudeValue > 90) {
              toast.error("Latitude must be between -90 and 90");
              return;
            }

            if (longitudeValue < -180 || longitudeValue > 180) {
              toast.error("Longitude must be between -180 and 180");
              return;
            }

            onSubmit({
              name,
              userId,
              password,
              latitude: latitudeValue,
              longitude: longitudeValue,
              defaultRadius: Number.isNaN(parsedRadius) ? 100 : parsedRadius,
              profilePhoto,
            });
          }}
        >
          <ProfilePhotoPicker
            name={name}
            imageUrl={previewUrl ?? initialValues?.avatar?.url ?? ""}
            onPick={setProfilePhoto}
          />

          <IconInput
            icon={User}
            placeholder="Enter User Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <IconInput
            icon={IdCard}
            placeholder="User ID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            required
          />

          <IconInput
            icon={Lock}
            type="password"
            placeholder={initialValues ? "New Password (optional)" : "Password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required={!initialValues}
          />

          <CoordinatesInput
            latitude={latitude}
            longitude={longitude}
            onLatitudeChange={setLatitude}
            onLongitudeChange={setLongitude}
          />

          <Input
            placeholder="Default Radius"
            value={defaultRadius}
            onChange={(event) => setDefaultRadius(event.target.value)}
            required
          />

          <OpenStreetMapPicker
            latitude={parsedLatitude}
            longitude={parsedLongitude}
            onChange={(nextLatitude, nextLongitude) => {
              setLatitude(nextLatitude.toFixed(6));
              setLongitude(nextLongitude.toFixed(6));
            }}
          />

          <p className="text-xs text-[#6f6f6f]">
            Click or drag the marker to set the user&apos;s location.
          </p>

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            <Plus className="size-4" />
            {loading
              ? initialValues
                ? "Updating..."
                : "Creating..."
              : initialValues
                ? "Update User"
                : "Add New User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProfilePhotoPicker({
  name,
  imageUrl,
  onPick,
}: {
  name: string;
  imageUrl: string;
  onPick: (file: File | null) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="relative">
        <Avatar className="size-[72px] border border-[#d8d8d8]">
          <AvatarImage src={imageUrl} alt={name || "User"} />
          <AvatarFallback>{getUserInitials(name || "User")}</AvatarFallback>
        </Avatar>
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            if (!nextFile) {
              return;
            }

            if (!nextFile.type.startsWith("image/")) {
              toast.error("Please upload a valid image file");
              return;
            }

            if (nextFile.size > 5 * 1024 * 1024) {
              toast.error("Image size must be under 5MB");
              return;
            }

            onPick(nextFile);
          }}
        />
      </div>
    </div>
  );
}

function CoordinatesInput({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}: {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        placeholder="Latitude"
        value={latitude}
        onChange={(event) => onLatitudeChange(event.target.value)}
        required
      />
      <Input
        placeholder="Longitude"
        value={longitude}
        onChange={(event) => onLongitudeChange(event.target.value)}
        required
      />
    </div>
  );
}

function IconInput({
  icon: Icon,
  className,
  ...props
}: ComponentProps<typeof Input> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
      <Input className={`pl-9 ${className ?? ""}`} {...props} />
    </div>
  );
}
