import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { UserProfile, Gender } from '../types/medical';

export interface Profile extends UserProfile {
  // Alias for compatibility if needed, but we should prefer UserProfile
}

interface ProfileContextType {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  setActiveProfile: (profile: UserProfile) => void;
  createProfile: (name: string) => Promise<void>;
  updateProfile: (id: string, newName: string) => Promise<void>;
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
        const fetchedProfiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        
        // Add default "Self" profile if none exists
        if (fetchedProfiles.length === 0) {
          const defaultProfile = { 
            name: 'Myself', 
            fullName: 'Myself',
            userId: user.uid,
            chronicConditions: [],
            allergies: [],
          };
          const docRef = await addDoc(collection(db, 'profiles'), {
            ...defaultProfile,
            createdAt: serverTimestamp()
          });
          const newProfile = { id: docRef.id, createdAt: new Date().toISOString(), ...defaultProfile } as UserProfile;
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
      const newProfileData = { 
        name, 
        fullName: name,
        userId: user.uid,
        chronicConditions: [],
        allergies: [],
      };
      const docRef = await addDoc(collection(db, 'profiles'), {
        ...newProfileData,
        createdAt: serverTimestamp()
      });
      const newProfile = { id: docRef.id, createdAt: new Date().toISOString(), ...newProfileData } as UserProfile;
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
      await updateDoc(docRef, { name: newName, fullName: newName });
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, name: newName, fullName: newName } : p));
      if (activeProfile?.id === id) {
        setActiveProfile({ ...activeProfile, name: newName, fullName: newName });
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
