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

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfiles([]);
      setActiveProfile(null);
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
    if (!user) return;
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
    if (!user) return;
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

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        isLoading,
      }}
    >
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
