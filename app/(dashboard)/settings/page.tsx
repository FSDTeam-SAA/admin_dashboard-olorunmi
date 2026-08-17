"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, PencilLine, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { changePassword, getApiMessage, getProfile, updateProfile } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { getUserInitials } from "@/lib/utils";
import type { UserListItem } from "@/types/api";

const getProfileDraft = (profile?: UserListItem & { bio?: string }) => ({
  name: profile?.name ?? "",
  phone: profile?.phone ?? "",
  bio: profile?.bio ?? "",
});

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState<{
    name: string;
    phone: string;
    bio: string;
  } | null>(null);
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
  });

  const displayProfile = useMemo(() => {
    const source = draftProfile ?? getProfileDraft(profileQuery.data);

    return {
      ...source,
      email: profileQuery.data?.email ?? "",
    };
  }, [draftProfile, profileQuery.data]);

  const draftAvatarPreviewUrl = useMemo(() => {
    if (!draftAvatarFile) {
      return null;
    }

    return URL.createObjectURL(draftAvatarFile);
  }, [draftAvatarFile]);

  useEffect(() => {
    return () => {
      if (draftAvatarPreviewUrl) {
        URL.revokeObjectURL(draftAvatarPreviewUrl);
      }
    };
  }, [draftAvatarPreviewUrl]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      toast.success(response.message || "Profile updated successfully");
      setIsEditing(false);
      setDraftProfile(null);
      setDraftAvatarFile(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to update profile"));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (response) => {
      toast.success(response.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to change password"));
    },
  });

  const startEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      setDraftProfile(null);
      setDraftAvatarFile(null);
      return;
    }

    setIsEditing(true);
    setDraftProfile(getProfileDraft(profileQuery.data));
    setDraftAvatarFile(null);
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Settings" subtitle="Settings" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="max-w-[400px]">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>

        <Card className="rounded-xl border-border bg-card">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            {profileQuery.isLoading ? (
              <>
                <Skeleton className="size-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="size-14 border border-border">
                  <AvatarImage
                    src={draftAvatarPreviewUrl ?? profileQuery.data?.avatar?.url ?? ""}
                    alt={profileQuery.data?.name ?? "Profile"}
                  />
                  <AvatarFallback className="font-bold">
                    {getUserInitials(profileQuery.data?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-text-primary">{displayProfile.name || "Olorunmi Admin"}</p>
                  <p className="text-xs text-text-secondary">{displayProfile.email}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <TabsContent value="personal">
          <Card className="rounded-xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-0 pt-4 sm:px-6">
              <CardTitle>Personal Information</CardTitle>
              <Button
                variant={isEditing ? "secondary" : "default"}
                size="sm"
                className="h-9 px-4"
                onClick={startEdit}
              >
                <PencilLine className="size-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
              {profileQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    profileMutation.mutate({
                      name: displayProfile.name,
                      phone: displayProfile.phone,
                      bio: displayProfile.bio,
                      avatar: draftAvatarFile,
                    });
                  }}
                >
                  <div className="space-y-2">
                    <Label className="text-xs text-text-tertiary">Profile Image</Label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Avatar className="size-16 border border-border">
                        <AvatarImage
                          src={draftAvatarPreviewUrl ?? profileQuery.data?.avatar?.url ?? ""}
                          alt={displayProfile.name || "Profile"}
                        />
                        <AvatarFallback>{getUserInitials(displayProfile.name)}</AvatarFallback>
                      </Avatar>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-avatar-upload"
                          className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-4 text-xs font-semibold shadow-xs transition-colors ${
                            isEditing
                              ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                              : "bg-secondary-bg text-text-tertiary opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <Upload className="size-3.5" />
                          Upload Image
                        </label>
                        <input
                          id="profile-avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={!isEditing}
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

                            setDraftAvatarFile(nextFile);
                          }}
                        />
                        <p className="text-xs text-text-quaternary">
                          JPG, PNG or WEBP. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-tertiary">Full Name</Label>
                    <Input
                      value={displayProfile.name}
                      onChange={(event) =>
                        setDraftProfile((current) => ({
                          name: event.target.value,
                          phone: current?.phone ?? profileQuery.data?.phone ?? "",
                          bio: current?.bio ?? getProfileDraft(profileQuery.data).bio,
                        }))
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-text-tertiary">Email Address</Label>
                      <Input value={displayProfile.email} readOnly className="opacity-75" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-text-tertiary">Phone Number</Label>
                      <Input
                        value={displayProfile.phone}
                        onChange={(event) =>
                          setDraftProfile((current) => ({
                            name: current?.name ?? profileQuery.data?.name ?? "",
                            phone: event.target.value,
                            bio: current?.bio ?? getProfileDraft(profileQuery.data).bio,
                          }))
                        }
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-tertiary">Bio / Role Notes</Label>
                    <Textarea
                      value={displayProfile.bio}
                      onChange={(event) =>
                        setDraftProfile((current) => ({
                          name: current?.name ?? profileQuery.data?.name ?? "",
                          phone: current?.phone ?? profileQuery.data?.phone ?? "",
                          bio: event.target.value,
                        }))
                      }
                      readOnly={!isEditing}
                      className="min-h-[100px] border-border bg-input-bg text-foreground"
                    />
                  </div>

                  {isEditing ? (
                    <div className="grid gap-3 sm:grid-cols-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={() => {
                          setIsEditing(false);
                          setDraftProfile(null);
                          setDraftAvatarFile(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="h-10" disabled={profileMutation.isPending}>
                        {profileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  ) : null}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="rounded-xl border-border bg-card">
            <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();

                  if (newPassword !== confirmPassword) {
                    toast.error("New password and confirm password do not match");
                    return;
                  }

                  passwordMutation.mutate({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                  });
                }}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((previous) => !previous)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((previous) => !previous)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-text-tertiary">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((previous) => !previous)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() => {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setShowCurrentPassword(false);
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                    }}
                  >
                    Reset Form
                  </Button>
                  <Button type="submit" className="h-10" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? "Saving..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
