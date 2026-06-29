import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, LogIn, LogOut } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface CloudSyncProps {
  onDataRestored: (data: { appData?: any; skills?: any; pins?: any; teachers?: any; docConfig?: any; }) => void;
  currentData: { appData: any; skills: any; pins: any; teachers: any; docConfig?: any; };
}

export function CloudSync({ onDataRestored, currentData }: CloudSyncProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        handleDownload(u);
      }
    });
    return () => unsubscribe();
  }, []);

  // Whenever local data changes and we are logged in, we should save to cloud after a small debounce
  useEffect(() => {
    if (!user || isSyncing) return;
    
    const timeout = setTimeout(() => {
      handleUpload(user);
    }, 3000); // Debounce sync by 3 seconds

    return () => clearTimeout(timeout);
  }, [currentData, user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login falhou", error);
      alert("O login falhou.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const handleUpload = async (currentUser = user) => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        appData: JSON.stringify(currentData.appData || {}),
        skills: JSON.stringify(currentData.skills || []),
        pins: JSON.stringify(currentData.pins || {}),
        teachers: JSON.stringify(currentData.teachers || []),
        docConfig: JSON.stringify(currentData.docConfig || {}),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setLastSync(new Date());
    } catch (error) {
      console.error("Erro no upload:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async (currentUser = user) => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        onDataRestored({
          appData: data.appData ? JSON.parse(data.appData) : undefined,
          skills: data.skills ? JSON.parse(data.skills) : undefined,
          pins: data.pins ? JSON.parse(data.pins) : undefined,
          teachers: data.teachers ? JSON.parse(data.teachers) : undefined,
          docConfig: data.docConfig ? JSON.parse(data.docConfig) : undefined
        });
        setLastSync(new Date());
      }
    } catch (error) {
      console.error("Erro no download:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) {
    return (
      <button 
        onClick={handleLogin}
        className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-slate-700"
      >
        <LogIn className="w-3.5 h-3.5" />
        Login na Nuvem
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-bold uppercase text-slate-500">
          {user.email}
        </span>
        <span className="text-[8px] text-slate-400 flex items-center gap-1">
          {isSyncing ? (
            <><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Sincronizando...</>
          ) : lastSync ? (
            <><Cloud className="w-2.5 h-2.5 text-escola-verde" /> Sincronizado {lastSync.toLocaleTimeString()}</>
          ) : (
            <><CloudOff className="w-2.5 h-2.5" /> Pronto para sincronizar</>
          )}
        </span>
      </div>
      <button 
        onClick={handleLogout}
        className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        title="Sair"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
