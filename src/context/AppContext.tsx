import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  getSettings,
  saveSettings,
  AppSettings,
  ReconciliationRecord,
} from "../lib/storage";

export type SyncStatus = "offline" | "syncing" | "synced" | "signed-out";

interface AppContextType {
  records: ReconciliationRecord[];
  settings: AppSettings;
  syncStatus: SyncStatus;
  addRecord: (record: ReconciliationRecord) => void;
  removeRecord: (id: string) => void;
  clearRecords: () => void;
  updateSettings: (settings: AppSettings) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("signed-out");

  // Apply theme + RTL
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    document.documentElement.dir = settings.language === "ar" ? "rtl" : "ltr";
  }, [settings]);

  // Subscribe to this user's records in Firestore. Firestore's persistent
  // local cache serves data instantly offline and syncs automatically once
  // connectivity returns — no manual write-queue needed.
  useEffect(() => {
    if (!user) {
      setRecords([]);
      setSyncStatus("signed-out");
      return;
    }

    setSyncStatus("syncing");
    const recordsQuery = query(
      collection(db, "users", user.uid, "records"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      recordsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((d) => d.data() as ReconciliationRecord);
        setRecords(data);
        // fromCache true + hasPendingWrites means we're showing local data
        // that hasn't reached the server yet (offline or still syncing).
        const pending = snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache;
        setSyncStatus(pending ? "syncing" : "synced");
      },
      () => {
        setSyncStatus("offline");
      },
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      if (!navigator.onLine && user) setSyncStatus("offline");
    };
    window.addEventListener("offline", updateOnlineStatus);
    window.addEventListener("online", updateOnlineStatus);
    return () => {
      window.removeEventListener("offline", updateOnlineStatus);
      window.removeEventListener("online", updateOnlineStatus);
    };
  }, [user]);

  const addRecord = (record: ReconciliationRecord) => {
    if (!user) return;
    // setDoc resolves immediately from the local cache even offline; the
    // write is queued and flushed automatically when back online.
    setDoc(doc(db, "users", user.uid, "records", record.id), {
      ...record,
      syncedAt: serverTimestamp(),
    });
  };

  const removeRecord = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, "users", user.uid, "records", id));
  };

  const clearRecords = async () => {
    if (!user) return;
    const snapshot = await getDocs(collection(db, "users", user.uid, "records"));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  };

  const updateSettings = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <AppContext.Provider
      value={{ records, settings, syncStatus, addRecord, removeRecord, clearRecords, updateSettings }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
