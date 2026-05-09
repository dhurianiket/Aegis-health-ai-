import { db } from '../lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface ShareOptions {
  profileId: string;
  userId: string;
  expiryHours: number;
  dataToExpose: {
    meds: boolean;
    labs: boolean;
    vitals: boolean;
    notes: boolean;
  };
}

export const generateShareLink = async (options: ShareOptions): Promise<string> => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + options.expiryHours);

  try {
    const shareRef = await addDoc(collection(db, 'shares'), {
      ...options,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now(),
      viewCount: 0,
      active: true
    });

    // Generate the URL. We'll use a query param 'share'
    const baseUrl = window.location.origin;
    return `${baseUrl}?share=${shareRef.id}`;
  } catch (error) {
    console.error("Error generating share link:", error);
    throw error;
  }
};
