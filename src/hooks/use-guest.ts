import { useState, useEffect, useCallback } from 'react';

export interface GuestRecording {
  id: string;
  name: string;
  audioBlob: Blob;
  duration: number;
  destination: 'vault' | 'archive' | 'letter';
  deliverAt?: string;
  createdAt: string;
}

const STORAGE_KEY = 'sound-capsule-guest';
const GUEST_ID_KEY = 'sound-capsule-guest-id';

function generateGuestId(): string {
  return 'guest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

function getGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function useGuest() {
  const [guestId] = useState(() => getGuestId());
  const [recordings, setRecordings] = useState<GuestRecording[]>([]);
  const [isBound, setIsBound] = useState(false);
  const [bindInfo, setBindInfo] = useState<{ type: 'phone' | 'email'; value: string } | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Convert audio base64 back to Blob
        const recordingsWithBlobs = data.recordings.map((r: any) => ({
          ...r,
          audioBlob: r.audioBase64 ? base64ToBlob(r.audioBase64, 'audio/webm') : r.audioBlob,
        }));
        setRecordings(recordingsWithBlobs);
        setIsBound(data.isBound || false);
        setBindInfo(data.bindInfo || null);
      }
    } catch (e) {
      console.error('Failed to load guest data:', e);
    }
  }, []);

  // Save to localStorage
  const saveRecordings = useCallback((newRecordings: GuestRecording[]) => {
    try {
      const data = {
        isBound,
        bindInfo,
        recordings: newRecordings.map(r => ({
          ...r,
          audioBlob: undefined, // Don't store Blob in JSON
          audioBase64: blobToBase64(r.audioBlob),
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save guest data:', e);
    }
  }, [isBound, bindInfo]);

  const addRecording = useCallback((recording: Omit<GuestRecording, 'id' | 'createdAt'>) => {
    const newRecording: GuestRecording = {
      ...recording,
      id: 'rec-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setRecordings(prev => {
      const updated = [newRecording, ...prev];
      saveRecordings(updated);
      return updated;
    });
    return newRecording.id;
  }, [saveRecordings]);

  const updateRecording = useCallback((id: string, updates: Partial<GuestRecording>) => {
    setRecordings(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveRecordings(updated);
      return updated;
    });
  }, [saveRecordings]);

  const deleteRecording = useCallback((id: string) => {
    setRecordings(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveRecordings(updated);
      return updated;
    });
  }, [saveRecordings]);

  const bindContact = useCallback((type: 'phone' | 'email', value: string) => {
    setIsBound(true);
    setBindInfo({ type, value });
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      data.isBound = true;
      data.bindInfo = { type, value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, []);

  const clearAllData = useCallback(() => {
    setRecordings([]);
    setIsBound(false);
    setBindInfo(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    guestId,
    recordings,
    isBound,
    bindInfo,
    addRecording,
    updateRecording,
    deleteRecording,
    bindContact,
    clearAllData,
  };
}

// Helper functions for Blob <-> Base64
function blobToBase64(blob: Blob): string {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data URL prefix
    };
    reader.readAsDataURL(blob);
  }) as any;
}

function base64ToBlob(base64: string, type: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}
