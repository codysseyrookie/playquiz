import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ExamResult, Problem, ProblemSet, Subject } from "@/lib/study-data";

export const HISTORY_KEY = "problem-solving-study-history-v1";
export const LIBRARY_KEY = "problem-solving-library-v2";
const LEGACY_LIBRARY_KEYS = ["problem-solving-library-v1"] as const;

export type LibrarySnapshot = {
  subjects: Subject[];
  problems: Problem[];
  problemSets: ProblemSet[];
};

function parseArray<T>(value: string | null): T[] | undefined {
  if (!value) return undefined;
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? parsed as T[] : undefined;
}

function parseLibrary(value: string | null): LibrarySnapshot | undefined {
  if (!value) return undefined;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") return undefined;
  const candidate = parsed as Partial<LibrarySnapshot>;
  if (!Array.isArray(candidate.subjects) || !Array.isArray(candidate.problems) || !Array.isArray(candidate.problemSets)) return undefined;
  return { subjects: candidate.subjects, problems: candidate.problems, problemSets: candidate.problemSets };
}

export async function loadStudyStorage() {
  const keys = [HISTORY_KEY, LIBRARY_KEY, ...LEGACY_LIBRARY_KEYS];
  const values = await AsyncStorage.multiGet(keys);
  const stored = new Map(values);
  const history = parseArray<ExamResult>(stored.get(HISTORY_KEY) ?? null) ?? [];
  const library = parseLibrary(stored.get(LIBRARY_KEY) ?? null)
    ?? LEGACY_LIBRARY_KEYS.map((key) => parseLibrary(stored.get(key) ?? null)).find(Boolean);
  return { history, library };
}

export async function saveStudyStorage(history: ExamResult[], library: LibrarySnapshot) {
  await AsyncStorage.multiSet([
    [HISTORY_KEY, JSON.stringify(history)],
    [LIBRARY_KEY, JSON.stringify(library)],
  ]);
}
