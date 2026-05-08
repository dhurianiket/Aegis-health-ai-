import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

export interface Profile {
  id: string;
  userId: string;
  name: string;
}

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  createProfile: (name: string) => Promise<void>;
  updateProfile: (id: string, newName: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      if (!user) {
        setProfiles([]);
        setActiveProfile(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const q = query(collection(db, 'profiles'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const fetchedProfiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
        
        // Add default "Self" profile if none exists
        if (fetchedProfiles.length === 0) {
          const defaultProfile = { name: 'Myself', userId: user.uid };
          const docRef = await addDoc(collection(db, 'profiles'), {
            ...defaultProfile,
            createdAt: serverTimestamp()
          });
          const newProfile = { id: docRef.id, ...defaultProfile };
          setProfiles([newProfile]);
          setActiveProfile(newProfile);
        } else {
          setProfiles(fetchedProfiles);
          if (!activeProfile || !fetchedProfiles.find(p => p.id === activeProfile.id)) {
            setActiveProfile(fetchedProfiles[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfiles();
  }, [user]);

  const createProfile = async (name: string) => {
    if (!user) return;
    try {
      const newProfileData = { name, userId: user.uid };
      const docRef = await addDoc(collection(db, 'profiles'), {
        ...newProfileData,
        createdAt: serverTimestamp()
      });
      const newProfile = { id: docRef.id, ...newProfileData };
      setProfiles(prev => [...prev, newProfile]);
      setActiveProfile(newProfile);
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  };

  const updateProfile = async (id: string, newName: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'profiles', id);
      await updateDoc(docRef, { name: newName });
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
      if (activeProfile?.id === id) {
        setActiveProfile({ ...activeProfile, name: newName });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    if (!user) return;
    try {
      if (profiles.length <= 1) {
        throw new Error("Cannot delete the last profile");
      }
      const docRef = doc(db, 'profiles', id);
      await deleteDoc(docRef);
      setProfiles(prev => prev.filter(p => p.id !== id));
      if (activeProfile?.id === id) {
        const remaining = profiles.filter(p => p.id !== id);
        setActiveProfile(remaining[0]);
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
      throw error;
    }
  };

  return (
    <ProfileContext.Provider value={{ profiles, activeProfile, setActiveProfile, createProfile, updateProfile, deleteProfile, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
