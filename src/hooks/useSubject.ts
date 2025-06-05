import { useEffect, useState, useCallback } from "react";
import useUser from "./useUser";
import { subjectsApi } from "../api";
interface Subject {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  testCount?: number;
  summaryCount?: number;
  tests?: number;
  summaries?: number;
}

let cachedSubject: Subject[] | null = null;

export function useSubject() {
  const [subjects, setSubjects] = useState<Subject[] | null>(cachedSubject);
  const [loading, setLoading] = useState(!cachedSubject);
  const [error, setError] = useState<null | string>(null);
  const { user } = useUser();

  const reloadSubject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subjectsApi.fetchSubjects(user?._id);
      console.log(data);
      
      cachedSubject = data;
      setSubjects(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (cachedSubject) return;
    reloadSubject();
  }, [reloadSubject]);

  return { subjects, setSubjects, loading, error, reloadSubject };
}
