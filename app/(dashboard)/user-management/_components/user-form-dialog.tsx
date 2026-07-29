"use client";

import { useEffect, useMemo, useState, type ComponentProps } from "react";
import {
  Building2,
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  MapPin,
  Plus,
  User,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, getUserInitials } from "@/lib/utils";
import type { UserListItem, WeeklyLocations } from "@/types/api";

import { OpenStreetMapPicker } from "./open-street-map-picker";

const DEFAULT_LATITUDE = 23.8103;
const DEFAULT_LONGITUDE = 90.4125;
const WEEK_DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

type WeekDayKey = (typeof WEEK_DAYS)[number]["key"];
type WeeklyLocationFormRow = {
  key: WeekDayKey;
  site: string;
  onShift: string;
  offShift: string;
  latitude: string;
  longitude: string;
  isWeekend: boolean;
};

export type UserFormPayload = {
  name: string;
  userId: string;
  password: string;
  site?: string;
  onShift: string;
  offShift: string;
  weeklyLocations: WeeklyLocations;
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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [weeklyLocationRows, setWeeklyLocationRows] = useState<WeeklyLocationFormRow[]>(() =>
    buildDefaultWeeklyLocationRows(initialValues)
  );
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [defaultRadius, setDefaultRadius] = useState(String(initialValues?.defaultRadius ?? 100));
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const previewUrl = useMemo(() => {
    if (!profilePhoto) {
      return null;
    }

    return URL.createObjectURL(profilePhoto);
  }, [profilePhoto]);

  const activeLocation = weeklyLocationRows[activeLocationIndex] ?? weeklyLocationRows[0];

  const parsedLatitude = useMemo(() => {
    const firstWorkingLocation =
      weeklyLocationRows.find((row) => !row.isWeekend) ?? weeklyLocationRows[0];
    const value = Number(
      activeLocation?.isWeekend ? firstWorkingLocation?.latitude : activeLocation?.latitude
    );
    return Number.isNaN(value) ? DEFAULT_LATITUDE : value;
  }, [activeLocation?.isWeekend, activeLocation?.latitude, weeklyLocationRows]);

  const parsedLongitude = useMemo(() => {
    const firstWorkingLocation =
      weeklyLocationRows.find((row) => !row.isWeekend) ?? weeklyLocationRows[0];
    const value = Number(
      activeLocation?.isWeekend ? firstWorkingLocation?.longitude : activeLocation?.longitude
    );
    return Number.isNaN(value) ? DEFAULT_LONGITUDE : value;
  }, [activeLocation?.isWeekend, activeLocation?.longitude, weeklyLocationRows]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl p-5 sm:w-[80vw] sm:!max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>{initialValues ? "Update user" : "Add New user"}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();

            const parsedRadius = Number(defaultRadius);
            const validationError = validateWeeklyLocationRows(weeklyLocationRows);

            if (validationError) {
              toast.error(validationError);
              return;
            }

            if (!Number.isNaN(parsedRadius) && parsedRadius <= 0) {
              toast.error("Default radius must be a positive number");
              return;
            }

            const weeklyLocations = rowsToWeeklyLocations(weeklyLocationRows);

            onSubmit({
              name,
              userId,
              password,
              site: getFirstWeeklyLocationSite(weeklyLocations),
              onShift: getFirstWeeklyLocationShift(weeklyLocations, "onShift"),
              offShift: getFirstWeeklyLocationShift(weeklyLocations, "offShift"),
              weeklyLocations,
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

          <PasswordInput
            visible={passwordVisible}
            onVisibleChange={setPasswordVisible}
            placeholder={initialValues ? "New Password (optional)" : "Password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required={!initialValues}
          />

          <WeeklyLocationsInput
            rows={weeklyLocationRows}
            activeIndex={activeLocationIndex}
            onActiveIndexChange={setActiveLocationIndex}
            onRowsChange={setWeeklyLocationRows}
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
              if (activeLocation?.isWeekend) {
                toast.error("Weekend rows do not need a map location");
                return;
              }

              setWeeklyLocationRows((currentRows) =>
                currentRows.map((row, index) =>
                  index === activeLocationIndex
                    ? {
                        ...row,
                        latitude: nextLatitude.toFixed(6),
                        longitude: nextLongitude.toFixed(6),
                      }
                    : row
                )
              );
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

function buildDefaultWeeklyLocationRows(initialValues: UserListItem | null) {
  const firstSavedLocation = WEEK_DAYS
    .map((weekDay) => initialValues?.weeklyLocations?.[weekDay.key])
    .find((location) => location?.latitude != null && location?.longitude != null);
  const fallbackLatitude = firstSavedLocation?.latitude ?? DEFAULT_LATITUDE;
  const fallbackLongitude = firstSavedLocation?.longitude ?? DEFAULT_LONGITUDE;

  return WEEK_DAYS.map((weekDay) => {
    const savedLocation = initialValues?.weeklyLocations?.[weekDay.key];

    return {
      key: weekDay.key,
      site: savedLocation?.site ?? initialValues?.site ?? "",
      onShift: savedLocation?.onShift ?? initialValues?.onShift ?? "",
      offShift: savedLocation?.offShift ?? initialValues?.offShift ?? "",
      latitude: String(savedLocation?.latitude ?? fallbackLatitude),
      longitude: String(savedLocation?.longitude ?? fallbackLongitude),
      isWeekend: savedLocation?.isWeekend ?? false,
    };
  });
}

function validateWeeklyLocationRows(rows: WeeklyLocationFormRow[]) {
  for (const row of rows) {
    if (row.isWeekend) {
      continue;
    }

    const dayLabel = WEEK_DAYS.find((weekDay) => weekDay.key === row.key)?.label ?? row.key;
    const latitudeValue = Number(row.latitude);
    const longitudeValue = Number(row.longitude);

    if (Number.isNaN(latitudeValue) || Number.isNaN(longitudeValue)) {
      return `${dayLabel} latitude and longitude must be valid numbers`;
    }

    if (latitudeValue < -90 || latitudeValue > 90) {
      return `${dayLabel} latitude must be between -90 and 90`;
    }

    if (longitudeValue < -180 || longitudeValue > 180) {
      return `${dayLabel} longitude must be between -180 and 180`;
    }
  }

  return null;
}

function rowsToWeeklyLocations(rows: WeeklyLocationFormRow[]): WeeklyLocations {
  return rows.reduce((weeklyLocations, row) => {
    const dayLabel = WEEK_DAYS.find((weekDay) => weekDay.key === row.key)?.label ?? row.key;

    weeklyLocations[row.key] = {
      day: dayLabel,
      site: row.isWeekend ? "" : row.site.trim(),
      onShift: row.isWeekend ? "" : row.onShift.trim(),
      offShift: row.isWeekend ? "" : row.offShift.trim(),
      latitude: row.isWeekend ? null : Number(row.latitude),
      longitude: row.isWeekend ? null : Number(row.longitude),
      isWeekend: row.isWeekend,
    };

    return weeklyLocations;
  }, {} as WeeklyLocations);
}

function getFirstWeeklyLocationSite(weeklyLocations: WeeklyLocations) {
  for (const weekDay of WEEK_DAYS) {
    if (weeklyLocations[weekDay.key]?.isWeekend) continue;

    const site = weeklyLocations[weekDay.key]?.site?.trim();
    if (site) {
      return site;
    }
  }

  return "";
}

function getFirstWeeklyLocationShift(
  weeklyLocations: WeeklyLocations,
  field: "onShift" | "offShift"
) {
  for (const weekDay of WEEK_DAYS) {
    if (weeklyLocations[weekDay.key]?.isWeekend) continue;

    const shift = weeklyLocations[weekDay.key]?.[field]?.trim();
    if (shift) {
      return shift;
    }
  }

  return "";
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

function WeeklyLocationsInput({
  rows,
  activeIndex,
  onActiveIndexChange,
  onRowsChange,
}: {
  rows: WeeklyLocationFormRow[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onRowsChange: (rows: WeeklyLocationFormRow[]) => void;
}) {
  const updateRow = (
    rowIndex: number,
    field: keyof Pick<
      WeeklyLocationFormRow,
      "site" | "onShift" | "offShift" | "latitude" | "longitude" | "isWeekend"
    >,
    value: string | boolean
  ) => {
    onRowsChange(
      rows.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row
      )
    );
  };

  return (
    <div className="space-y-2 rounded-xl border border-[#dfdfdf] bg-[#f7f7f7] p-2">
      <div className="flex items-center gap-2 px-1 text-sm font-semibold text-[#2f2f2f]">
        <CalendarDays className="size-4 text-[#8f7f52]" />
        7 day locations
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => {
          const isActive = index === activeIndex;
          const isWeekend = row.isWeekend;

          return (
            <div
              key={row.key}
              className={cn(
                "grid gap-2 rounded-lg border p-2 md:grid-cols-[minmax(120px,0.7fr)_minmax(260px,1.6fr)_minmax(120px,0.75fr)_minmax(120px,0.75fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)]",
                "cursor-pointer",
                isActive
                  ? isWeekend
                    ? "border-[#a79663] bg-[#eeeeee] text-[#777777]"
                    : "border-[#a79663] bg-white"
                  : isWeekend
                    ? "border-transparent bg-[#eeeeee] text-[#777777]"
                    : "border-transparent bg-[#ececec]"
              )}
            >
              <button
                type="button"
                className="flex min-h-10 items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-[#2f2f2f] hover:bg-[#f8f6ef]"
                onClick={() => onActiveIndexChange(index)}
              >
                <MapPin className="size-4 shrink-0 text-[#8f7f52]" />
                <span>{WEEK_DAYS[index].label}</span>
              </button>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <IconInput
                  icon={Building2}
                  placeholder={isWeekend ? "-" : "Site"}
                  value={isWeekend ? "" : row.site}
                  onChange={(event) =>
                    updateRow(index, "site", event.target.value)
                  }
                  disabled={isWeekend}
                />
                <label className="flex h-11 items-center gap-2 rounded-xl bg-[#e7e7e7] px-3 text-xs font-medium text-[#4f4f4f]">
                  <Checkbox
                    checked={isWeekend}
                    aria-label={`Mark ${WEEK_DAYS[index].label} as weekend`}
                    onCheckedChange={(checked) =>
                      updateRow(index, "isWeekend", checked === true)
                    }
                  />
                  Weekend
                </label>
              </div>

              <IconInput
                icon={Clock}
                type="time"
                aria-label="On Shift"
                title="On Shift"
                value={isWeekend ? "" : row.onShift}
                onChange={(event) =>
                  updateRow(index, "onShift", event.target.value)
                }
                disabled={isWeekend}
              />

              <IconInput
                icon={Clock}
                type="time"
                aria-label="Off Shift"
                title="Off Shift"
                value={isWeekend ? "" : row.offShift}
                onChange={(event) =>
                  updateRow(index, "offShift", event.target.value)
                }
                disabled={isWeekend}
              />

              <Input
                placeholder={isWeekend ? "-" : "Latitude"}
                value={isWeekend ? "" : row.latitude}
                onChange={(event) =>
                  updateRow(index, "latitude", event.target.value)
                }
                required={!isWeekend}
                disabled={isWeekend}
              />
              <Input
                placeholder={isWeekend ? "-" : "Longitude"}
                value={isWeekend ? "" : row.longitude}
                onChange={(event) =>
                  updateRow(index, "longitude", event.target.value)
                }
                required={!isWeekend}
                disabled={isWeekend}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PasswordInput({
  visible,
  onVisibleChange,
  ...props
}: ComponentProps<typeof Input> & {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
      <Input className="pr-11 pl-9" type={visible ? "text" : "password"} {...props} />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-[#6f6f6f] hover:text-[#1f1f1f]"
        onClick={() => onVisibleChange(!visible)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
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
