"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { PageSizeSelect } from "@/components/common/page-size-select";
import { PaginationControls } from "@/components/common/pagination-controls";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createLocation,
  deleteLocation,
  getApiMessage,
  getLocations,
  updateLocation,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import type { LocationItem } from "@/types/api";

import { LocationFormDialog } from "./_components/location-form-dialog";

const DEFAULT_PAGE_SIZE = 10;

export default function LocationManagementPage() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<LocationItem | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const locationsQuery = useQuery({
    queryKey: QUERY_KEYS.locations(search),
    queryFn: () => getLocations(search ? { search } : undefined),
  });

  const invalidateLocations = () => {
    queryClient.invalidateQueries({ queryKey: ["locations"] });
  };

  const createLocationMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: (response) => {
      toast.success(response.message || "Location created successfully");
      setLocationFormOpen(false);
      invalidateLocations();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to create location"));
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: updateLocation,
    onSuccess: (response) => {
      toast.success(response.message || "Location updated successfully");
      setLocationFormOpen(false);
      setEditingLocation(null);
      invalidateLocations();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to update location"));
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: (response) => {
      toast.success(response.message || "Location deleted successfully");
      setLocationToDelete(null);
      invalidateLocations();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to delete location"));
    },
  });

  const allLocations = useMemo(() => locationsQuery.data ?? [], [locationsQuery.data]);

  const totalEntries = allLocations.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentPage = Math.min(page, totalPages);

  const locations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allLocations.slice(start, start + pageSize);
  }, [allLocations, currentPage, pageSize]);

  const startResult = totalEntries ? (currentPage - 1) * pageSize + 1 : 0;
  const endResult = (currentPage - 1) * pageSize + locations.length;

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setLocationFormOpen(true);
  };

  const handleOpenEdit = (location: LocationItem) => {
    setEditingLocation(location);
    setLocationFormOpen(true);
  };

  return (
    <section className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Location Management
          </h1>
          <p className="text-sm text-text-tertiary">
            Manage the patrol locations users can be scheduled to.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 sm:self-auto"
        >
          <Plus className="size-4" />
          Add New Location
        </Button>
      </div>

      {/* Search Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-[340px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          <Input
            placeholder="Search locations..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-10 rounded-lg border border-border bg-card pl-9 text-xs text-text-primary placeholder:text-text-quaternary"
          />
        </div>
      </div>

      {/* Locations List */}
      {locationsQuery.isLoading ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-xs">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={`location-skeleton-${index}`} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : locationsQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-10 text-center text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {getApiMessage(locationsQuery.error, "Unable to load locations")}
        </p>
      ) : allLocations.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-14 text-center shadow-xs">
          <MapPin className="mx-auto mb-3 size-8 text-text-quaternary" />
          <p className="text-sm font-semibold text-text-primary">
            {search ? "No locations match your search" : "No locations yet"}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {search
              ? "Try a different location name."
              : "Add your first location to start scheduling users to it."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 border-b border-border px-4 py-3 text-xs font-semibold tracking-wide text-text-tertiary uppercase sm:grid">
            <span>Location</span>
            <span>Coordinates</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-border">
            {locations.map((location) => (
              <div
                key={location._id}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <MapPin className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <p className="truncate text-sm font-medium text-text-primary">
                    {location.name}
                  </p>
                </div>

                <p className="text-xs text-text-tertiary">
                  {location.latitude}, {location.longitude}
                </p>

                <div className="flex items-center gap-1.5 sm:justify-end">
                  <Button
                    type="button"
                    variant="slateOutline"
                    size="sm"
                    className="h-8 rounded-md px-3 text-xs font-medium"
                    onClick={() => handleOpenEdit(location)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-md border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                    onClick={() => setLocationToDelete(location)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer & Pagination */}
      {allLocations.length > 0 ? (
        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-text-tertiary">
              Showing {startResult} to {endResult} of {totalEntries} entries
            </p>
            <PageSizeSelect
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setPage(1);
              }}
            />
          </div>
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            showTextLabels
          />
        </div>
      ) : null}

      {/* Location Create/Edit Dialog */}
      <LocationFormDialog
        key={`location-${editingLocation?._id ?? "new"}-${
          locationFormOpen ? "open" : "closed"
        }`}
        open={locationFormOpen}
        onOpenChange={(value) => {
          setLocationFormOpen(value);
          if (!value) setEditingLocation(null);
        }}
        initialValues={editingLocation}
        loading={createLocationMutation.isPending || updateLocationMutation.isPending}
        onSubmit={(payload) => {
          if (editingLocation) {
            updateLocationMutation.mutate({ id: editingLocation._id, ...payload });
            return;
          }

          createLocationMutation.mutate(payload);
        }}
      />

      {/* Confirm Delete Location */}
      <ConfirmDialog
        open={Boolean(locationToDelete)}
        onOpenChange={(value) => {
          if (!value) setLocationToDelete(null);
        }}
        title="Delete Location?"
        description={`Are you sure you want to delete "${locationToDelete?.name ?? ""}"? Users already scheduled here keep their saved coordinates, but this location will no longer be selectable.`}
        confirmText="Delete"
        confirmVariant="destructive"
        loading={deleteLocationMutation.isPending}
        onConfirm={() => {
          if (locationToDelete) {
            deleteLocationMutation.mutate(locationToDelete._id);
          }
        }}
      />
    </section>
  );
}
