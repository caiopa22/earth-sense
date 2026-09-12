import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Profile = {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  [key: string]: unknown;
};

type ProfileContextType = {
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  clearProfile: () => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({
  children,
  initialProfile = null,
}: {
  children: ReactNode;
  initialProfile?: Profile | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);

  const clearProfile = () => setProfile(null);

  const value = useMemo<ProfileContextType>(
    () => ({
      profile,
      setProfile,
      isLoading,
      setIsLoading,
      clearProfile,
    }),
    [profile, isLoading],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }

  return context;
}

export default useProfile;
