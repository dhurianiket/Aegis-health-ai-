import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { UserProfile, Gender } from "../types/medical";
import { DEMO_PROFILE } from "../data/sandboxDemoData";

const DEMO_PAEDIATRIC_PROFILE: UserProfile = {
  id: "sandbox-paediatric-profile",
  userId: "sandbox-demo-user",
  fullName: "Vihaan Sharma (Paediatric Sample)",
  name: "Vihaan Sharma",
  dob: "2016-08-12",
  gender: Gender.MALE,
  bloodType: "O+",
  height: 138,
  weight: 32,
  bmi: 16.8,
  chronicConditions: [],
  allergies: [],
  paediatricConsent: {
    isMinor: true,
    guardianName: "Aarav Sharma",
    guardianRelationship: "Parent",
    guardianConsentGiven: true,
    guardianConsentId: "DPDP-SEC9-SANDBOX-DEMO",
    strictNoAiTraining: true,
    noBehavioralTracking: true,
    dataRetentionPolicy: "72h_erasure_on_demand",
  },
  avatarConfig: {
    presetId: "astro-cub",
    hairStyle: "spiky",
    accessory: "star-badge",
    expression: "happy",
  },
  createdAt: "2026-07-01T09:00:00.000Z",
};

export interface Profile extends UserProfile {
  // Alias for compatibility if needed, but we should prefer UserProfile
}

interface ProfileContextType {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  setActiveProfile: (profile: UserProfile) => void;
  createProfile: (name: string) => Promise<void>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([DEMO_PROFILE, DEMO_PAEDIATRIC_PROFILE]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(DEMO_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfiles([DEMO_PROFILE, DEMO_PAEDIATRIC_PROFILE]);
      setActiveProfile(DEMO_PROFILE);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "profiles"),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const fetchedProfiles = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as UserProfile,
        );

        // Store fetched profiles
        setProfiles(fetchedProfiles);
        
        // If none exist, bootstrap in background
        if (fetchedProfiles.length === 0) {
          try {
            const defaultProfile = {
              name: "Myself",
              fullName: "Myself",
              userId: user.uid,
              chronicConditions: [],
              allergies: [],
            };
            await addDoc(collection(db, "users", user.uid, "profiles"), {
              ...defaultProfile,
              createdAt: serverTimestamp(),
            });
            // onSnapshot will recapture this after it's created
          } catch (error) {
            console.error("Failed to bootstrap profile:", error);
          }
        } else {
          // Set active profile if not already set or if it was deleted
          if (
            !activeProfile ||
            !fetchedProfiles.find((p) => p.id === activeProfile.id)
          ) {
            setActiveProfile(fetchedProfiles[0]);
          }
        }
      } catch (error) {
        console.error("Error processing profile snapshot:", error);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Profile onSnapshot error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createProfile = async (name: string) => {
    if (!user) {
      const localProfile: UserProfile = {
        id: `sandbox-${Date.now()}`,
        userId: "sandbox-demo-user",
        name,
        fullName: name,
        chronicConditions: [],
        allergies: [],
        createdAt: new Date().toISOString(),
      };
      setProfiles((prev) => [...prev, localProfile]);
      setActiveProfile(localProfile);
      return;
    }
    try {
      const newProfileData = {
        name,
        fullName: name,
        userId: user.uid,
        chronicConditions: [],
        allergies: [],
      };
      const docRef = await addDoc(collection(db, "users", user.uid, "profiles"), {
        ...newProfileData,
        createdAt: serverTimestamp(),
      });
      const newProfile = {
        id: docRef.id,
        createdAt: new Date().toISOString(),
        ...newProfileData,
      } as UserProfile;
      setProfiles((prev) => [...prev, newProfile]);
      setActiveProfile(newProfile);
    } catch (error) {
      console.error("Failed to create profile:", error);
      throw error;
    }
  };

  const updateProfile = async (id: string, updates: Partial<UserProfile>) => {
    if (!user) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      if (activeProfile?.id === id) {
        setActiveProfile({ ...activeProfile, ...updates });
      }
      return;
    }
    try {
      const docRef = doc(db, "users", user.uid, "profiles", id);
      await updateDoc(docRef, updates);
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      if (activeProfile?.id === id) {
        setActiveProfile({ ...activeProfile, ...updates });
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    if (!user) return;
    try {
      if (profiles.length <= 1) {
        throw new Error("Cannot delete the last profile");
      }
      const docRef = doc(db, "users", user.uid, "profiles", id);
      await deleteDoc(docRef);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      if (activeProfile?.id === id) {
        const remaining = profiles.filter((p) => p.id !== id);
        setActiveProfile(remaining[0]);
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
      throw error;
    }
  };

  const value = React.useMemo(
    () => ({
      profiles,
      activeProfile,
      setActiveProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      isLoading,
    }),
    [profiles, activeProfile, isLoading]
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
