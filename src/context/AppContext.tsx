import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getSettings,
  saveSettings,
  AppSettings,
  ReconciliationRecord,
} from "../lib/storage";

export type SyncStatus = "offline" | "syncing" | "synced" | "signed-out" | "error";

interface AppContextType {
  records: ReconciliationRecord[];
  settings: AppSettings;
  syncStatus: SyncStatus;
  syncError: string | null;
  addRecord: (record: ReconciliationRecord) => void;
  removeRecord: (id: string) => void;
  clearRecords: () => void;
  updateSettings: (settings: AppSettings) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function describeFirestoreError(err: FirestoreError, isAr: boolean): string {
  if (err.code === "permission-denied") {
    return isAr
      ? "الوصول مرفوض — تأكد بلي Firestore Rules منشورة (Publish) فFirebase Console"
      : "Permission denied — make sure Firestore Rules are published in Firebase Console";
  }
  if (err.code === "unavailable") {
    return isAr ? "ما قدرتش نوصل للسيرفر، تأكد من الاتصال بالنت" : "Couldn't reach the server, check your connection";
  }
  return isAr ? `خطأ: ${err.message}` : `Error: ${err.message}`;
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("signed-out");
  const [syncError, setSyncError] = useState<string | null>(null);
  const isAr = settings.language === "ar";
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setSyncError(null);
      return;
    }

    setSyncStatus("syncing");
    setSyncError(null);
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
        if (!pending) setSyncError(null);
      },
      (err: FirestoreError) => {
        setSyncStatus("error");
        const message = describeFirestoreError(err, isAr);
        setSyncError(message);
        toast({ title: message });
      },
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // If we stay stuck on "syncing" for too long, the most common cause is
  // Firestore rules blocking the request silently (writes just sit queued
  // with no error surfaced by the SDK). Give the user an actionable hint
  // instead of an endless spinner.
  useEffect(() => {
    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }
    if (syncStatus === "syncing") {
      stuckTimerRef.current = setTimeout(() => {
        setSyncError(
          isAr
            ? "المزامنة عالقة أكثر من اللازم — تأكد بلي Firestore Rules منشورة (Publish) فFirebase Console، وبلي عندك اتصال بالنت"
            : "Sync has been stuck too long — make sure Firestore Rules are published in Firebase Console and you have a network connection",
        );
      }, 12000);
    }
    return () => {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, [syncStatus, isAr]);

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
    // write is queued and flushed automatically when back online. If the
    // server ultimately rejects it (e.g. rules), we surface that error.
    setDoc(doc(db, "users", user.uid, "records", record.id), {
      ...record,
      syncedAt: serverTimestamp(),
    }).catch((err: FirestoreError) => {
      const message = describeFirestoreError(err, isAr);
      setSyncError(message);
      setSyncStatus("error");
      toast({ title: message });
    });
  };

  const removeRecord = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, "users", user.uid, "records", id)).catch((err: FirestoreError) => {
      const message = describeFirestoreError(err, isAr);
      setSyncError(message);
      toast({ title: message });
    });
  };

  const clearRecords = async () => {
    if (!user) return;
    try {
      const snapshot = await getDocs(collection(db, "users", user.uid, "records"));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      const message = describeFirestoreError(err as FirestoreError, isAr);
      setSyncError(message);
      toast({ title: message });
    }
  };

  const updateSettings = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <AppContext.Provider
      value={{ records, settings, syncStatus, syncError, addRecord, removeRecord, clearRecords, updateSettings }}
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
