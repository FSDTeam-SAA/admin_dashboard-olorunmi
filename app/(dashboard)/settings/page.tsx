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
        <TabsList>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>

        <Card className="rounded-xl bg-[#f4f4f4]">
          <CardContent className="flex items-center gap-3 p-4">
            {profileQuery.isLoading ? (
              <>
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="size-12">
                  <AvatarImage
                    src={draftAvatarPreviewUrl ?? profileQuery.data?.avatar?.url ?? ""}
                    alt={profileQuery.data?.name ?? "Profile"}
                  />
                  <AvatarFallback>{getUserInitials(profileQuery.data?.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-[#1f1f1f]">{displayProfile.name}</p>
                  <p className="text-sm text-[#535353]">{displayProfile.email}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <TabsContent value="personal">
          <Card className="rounded-xl bg-[#f4f4f4]">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-0 pt-4 sm:px-6">
              <CardTitle>Personal Information</CardTitle>
              <Button
                variant={isEditing ? "secondary" : "default"}
                className="h-10 px-4"
                onClick={startEdit}
              >
                <PencilLine className="size-4" />
                {isEditing ? "Cancel" : "Edit"}
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
                  <div className="space-y-1.5">
                    <Label>Profile Image</Label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Avatar className="size-16 border border-[#d8d8d8]">
                        <AvatarImage
                          src={draftAvatarPreviewUrl ?? profileQuery.data?.avatar?.url ?? ""}
                          alt={displayProfile.name || "Profile"}
                        />
                        <AvatarFallback>{getUserInitials(displayProfile.name)}</AvatarFallback>
                      </Avatar>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="profile-avatar-upload"
                          className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors ${
                            isEditing
                              ? "bg-[#a79663] text-white hover:bg-[#8f7f52]"
                              : "bg-[#e2e2e2] text-[#6a6a6a]"
                          }`}
                        >
                          <Upload className="size-4" />
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
                        <p className="text-xs text-[#6b6b6b]">
                          JPG/PNG/WEBP. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Name</Label>
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
                      <Label>Email Address</Label>
                      <Input value={displayProfile.email} readOnly className="opacity-75" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
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
                    <Label>Bio</Label>
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
                      className="min-h-[120px]"
                    />
                  </div>

                  {isEditing ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => {
                          setIsEditing(false);
                          setDraftProfile(null);
                          setDraftAvatarFile(null);
                        }}
                      >
                        Not Now
                      </Button>
                      <Button type="submit" className="h-11" disabled={profileMutation.isPending}>
                        {profileMutation.isPending ? "Saving..." : "Save Change"}
                      </Button>
                    </div>
                  ) : null}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="rounded-xl bg-[#f4f4f4]">
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
                  <Label>Current Password</Label>
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
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-[#7a7a7a]"
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
                  <Label>New Password</Label>
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
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-[#7a7a7a]"
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
                  <Label>Confirm New Password</Label>
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
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-[#7a7a7a]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setShowCurrentPassword(false);
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                    }}
                  >
                    Not Now
                  </Button>
                  <Button type="submit" className="h-11" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? "Saving..." : "Save Change"}
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
