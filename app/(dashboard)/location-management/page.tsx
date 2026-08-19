"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createSite,
  createSiteLocation,
  deleteSite,
  deleteSiteLocation,
  getApiMessage,
  getSites,
  updateSite,
  updateSiteLocation,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import type { SiteItem, SiteLocation } from "@/types/api";

import { LocationFormDialog } from "./_components/location-form-dialog";
import { SiteFormDialog } from "./_components/site-form-dialog";

export default function LocationManagementPage() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [siteFormOpen, setSiteFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<SiteItem | null>(null);

  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [locationSite, setLocationSite] = useState<SiteItem | null>(null);
  const [editingLocation, setEditingLocation] = useState<SiteLocation | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<{
    site: SiteItem;
    location: SiteLocation;
  } | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const sitesQuery = useQuery({
    queryKey: QUERY_KEYS.sites(search),
    queryFn: () => getSites(search ? { search } : undefined),
  });

  const invalidateSites = () => {
    queryClient.invalidateQueries({ queryKey: ["sites"] });
  };

  const createSiteMutation = useMutation({
    mutationFn: createSite,
    onSuccess: (response) => {
      toast.success(response.message || "Site created successfully");
      setSiteFormOpen(false);
      invalidateSites();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to create site"));
    },
  });

  const updateSiteMutation = useMutation({
    mutationFn: updateSite,
    onSuccess: (response) => {
      toast.success(response.message || "Site updated successfully");
      setSiteFormOpen(false);
      setEditingSite(null);
      invalidateSites();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to update site"));
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: (response) => {
      toast.success(response.message || "Site deleted successfully");
      setSiteToDelete(null);
      invalidateSites();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to delete site"));
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: createSiteLocation,
    onSuccess: (response) => {
      toast.success(response.message || "Location added successfully");
      setLocationFormOpen(false);
      invalidateSites();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to add location"));
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: updateSiteLocation,
    onSuccess: (response) => {
      toast.success(response.message || "Location updated successfully");
      setLocationFormOpen(false);
      setEditingLocation(null);
      invalidateSites();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to update location"));
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: deleteSiteLocation,
    onSuccess: (response) => {
      toast.success(response.message || "Location deleted successfully");
      setLocationToDelete(null);
      invalidateSites();
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to delete location"));
    },
  });

  const sites = sitesQuery.data ?? [];

  const handleOpenCreateSite = () => {
    setEditingSite(null);
    setSiteFormOpen(true);
  };

  const handleOpenEditSite = (site: SiteItem) => {
    setEditingSite(site);
    setSiteFormOpen(true);
  };

  const handleOpenCreateLocation = (site: SiteItem) => {
    setLocationSite(site);
    setEditingLocation(null);
    setLocationFormOpen(true);
  };

  const handleOpenEditLocation = (site: SiteItem, location: SiteLocation) => {
    setLocationSite(site);
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
            Manage sites and the patrol locations that belong to them.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateSite}
          className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 sm:self-auto"
        >
          <Plus className="size-4" />
          Add New Site
        </Button>
      </div>

      {/* Search Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-[340px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          <Input
            placeholder="Search sites..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-10 rounded-lg border border-border bg-card pl-9 text-xs text-text-primary placeholder:text-text-quaternary"
          />
        </div>
      </div>

      {/* Sites List */}
      {sitesQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`site-skeleton-${index}`}
              className="rounded-xl border border-border bg-card p-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : sitesQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-10 text-center text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {getApiMessage(sitesQuery.error, "Unable to load sites")}
        </p>
      ) : sites.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-14 text-center shadow-xs">
          <Building2 className="mx-auto mb-3 size-8 text-text-quaternary" />
          <p className="text-sm font-semibold text-text-primary">
            {search ? "No sites match your search" : "No sites yet"}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {search
              ? "Try a different site name."
              : "Create your first site to start adding locations."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map((site) => (
            <div
              key={site._id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
            >
              {/* Site Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {site.name}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {site.locations.length}{" "}
                      {site.locations.length === 1 ? "location" : "locations"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="tealOutline"
                    size="sm"
                    className="h-9 rounded-md px-3 text-xs font-medium"
                    onClick={() => handleOpenCreateLocation(site)}
                  >
                    <Plus className="size-3.5" />
                    Add Location
                  </Button>
                  <Button
                    type="button"
                    variant="slateOutline"
                    size="sm"
                    className="h-9 rounded-md px-3 text-xs font-medium"
                    onClick={() => handleOpenEditSite(site)}
                  >
                    <Pencil className="size-3.5" />
                    Rename
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-md border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                    onClick={() => setSiteToDelete(site)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Locations */}
              <div className="p-4">
                {site.locations.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-secondary-bg/30 px-3 py-6 text-center text-xs text-text-tertiary">
                    No locations added to this site yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {site.locations.map((location) => (
                      <div
                        key={location._id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary-bg/30 px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <MapPin className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">
                              {location.name}
                            </p>
                            <p className="text-[11px] text-text-tertiary">
                              {location.latitude}, {location.longitude}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="slateOutline"
                            size="sm"
                            className="h-8 rounded-md px-3 text-xs font-medium"
                            onClick={() => handleOpenEditLocation(site, location)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-md border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                            onClick={() => setLocationToDelete({ site, location })}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Site Create/Edit Dialog */}
      <SiteFormDialog
        key={`site-${editingSite?._id ?? "new"}-${siteFormOpen ? "open" : "closed"}`}
        open={siteFormOpen}
        onOpenChange={(value) => {
          setSiteFormOpen(value);
          if (!value) setEditingSite(null);
        }}
        initialValues={editingSite}
        loading={createSiteMutation.isPending || updateSiteMutation.isPending}
        onSubmit={(payload) => {
          if (editingSite) {
            updateSiteMutation.mutate({ id: editingSite._id, ...payload });
            return;
          }

          createSiteMutation.mutate(payload);
        }}
      />

      {/* Location Create/Edit Dialog */}
      <LocationFormDialog
        key={`location-${locationSite?._id ?? "none"}-${editingLocation?._id ?? "new"}-${
          locationFormOpen ? "open" : "closed"
        }`}
        open={locationFormOpen}
        onOpenChange={(value) => {
          setLocationFormOpen(value);
          if (!value) setEditingLocation(null);
        }}
        siteName={locationSite?.name ?? ""}
        initialValues={editingLocation}
        loading={createLocationMutation.isPending || updateLocationMutation.isPending}
        onSubmit={(payload) => {
          if (!locationSite) return;

          if (editingLocation) {
            updateLocationMutation.mutate({
              siteId: locationSite._id,
              locationId: editingLocation._id,
              ...payload,
            });
            return;
          }

          createLocationMutation.mutate({ siteId: locationSite._id, ...payload });
        }}
      />

      {/* Confirm Delete Site */}
      <ConfirmDialog
        open={Boolean(siteToDelete)}
        onOpenChange={(value) => {
          if (!value) setSiteToDelete(null);
        }}
        title="Delete Site?"
        description={`Are you sure you want to delete "${siteToDelete?.name ?? ""}" and all of its locations? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
        loading={deleteSiteMutation.isPending}
        onConfirm={() => {
          if (siteToDelete) {
            deleteSiteMutation.mutate(siteToDelete._id);
          }
        }}
      />

      {/* Confirm Delete Location */}
      <ConfirmDialog
        open={Boolean(locationToDelete)}
        onOpenChange={(value) => {
          if (!value) setLocationToDelete(null);
        }}
        title="Remove Location?"
        description={`Are you sure you want to remove "${locationToDelete?.location.name ?? ""}" from ${locationToDelete?.site.name ?? ""}?`}
        confirmText="Remove"
        confirmVariant="destructive"
        loading={deleteLocationMutation.isPending}
        onConfirm={() => {
          if (locationToDelete) {
            deleteLocationMutation.mutate({
              siteId: locationToDelete.site._id,
              locationId: locationToDelete.location._id,
            });
          }
        }}
      />
    </section>
  );
}
