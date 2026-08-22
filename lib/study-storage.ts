import AsyncStorage from "@react-native-async-storage/async-storage";

import { resolveAnswerCheckMode } from "./study-data";
import type { AnswerCheckMode, ExamResult, Problem, ProblemSet, Subject } from "@/lib/study-data";

export const HISTORY_KEY = "problem-solving-study-history-v1";
export const LIBRARY_KEY = "problem-solving-library-v2";
export const EXAM_DRAFT_KEY = "problem-solving-exam-draft-v1";
const LEGACY_LIBRARY_KEYS = ["problem-solving-library-v1"] as const;

export type LibrarySnapshot = {
  subjects: Subject[];
  problems: Problem[];
  problemSets: ProblemSet[];
};

export type ExamDraftSnapshot = {
  title: string;
  problemIds: string[];
  answers: Record<string, string>;
  checkedProblemIds: string[];
  answerCheckMode: AnswerCheckMode;
  questionIndex: number;
  elapsedSeconds: number;
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

function parseExamDraft(value: string | null): ExamDraftSnapshot | undefined {
  if (!value) return undefined;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") return undefined;
  const candidate = parsed as Partial<ExamDraftSnapshot>;
  if (typeof candidate.title !== "string" || !Array.isArray(candidate.problemIds) || candidate.problemIds.some((id) => typeof id !== "string")) return undefined;
  if (!candidate.answers || typeof candidate.answers !== "object" || Array.isArray(candidate.answers)) return undefined;
  const answerEntries = Object.entries(candidate.answers);
  if (answerEntries.some(([, answer]) => typeof answer !== "string")) return undefined;
  const checkedProblemIds = Array.isArray(candidate.checkedProblemIds)
    ? candidate.checkedProblemIds.filter((id): id is string => typeof id === "string")
    : [];
  const answerCheckMode = resolveAnswerCheckMode(candidate.answerCheckMode);
  const questionIndex = Number.isInteger(candidate.questionIndex) && Number(candidate.questionIndex) >= 0 ? Number(candidate.questionIndex) : 0;
  const elapsedSeconds = Number.isFinite(candidate.elapsedSeconds) && Number(candidate.elapsedSeconds) >= 0 ? Math.floor(Number(candidate.elapsedSeconds)) : 0;
  return { title: candidate.title, problemIds: candidate.problemIds, answers: Object.fromEntries(answerEntries), checkedProblemIds, answerCheckMode, questionIndex, elapsedSeconds };
}

export async function loadStudyStorage() {
  const keys = [HISTORY_KEY, LIBRARY_KEY, EXAM_DRAFT_KEY, ...LEGACY_LIBRARY_KEYS];
  const values = await AsyncStorage.multiGet(keys);
  const stored = new Map(values);
  const history = parseArray<ExamResult>(stored.get(HISTORY_KEY) ?? null) ?? [];
  const library = parseLibrary(stored.get(LIBRARY_KEY) ?? null)
    ?? LEGACY_LIBRARY_KEYS.map((key) => parseLibrary(stored.get(key) ?? null)).find(Boolean);
  const examDraft = parseExamDraft(stored.get(EXAM_DRAFT_KEY) ?? null);
  return { history, library, examDraft };
}

export async function saveStudyStorage(history: ExamResult[], library: LibrarySnapshot) {
  await AsyncStorage.multiSet([
    [HISTORY_KEY, JSON.stringify(history)],
    [LIBRARY_KEY, JSON.stringify(library)],
  ]);
}

export async function saveExamDraft(examDraft: ExamDraftSnapshot) {
  await AsyncStorage.setItem(EXAM_DRAFT_KEY, JSON.stringify(examDraft));
}

export async function clearExamDraft() {
  await AsyncStorage.removeItem(EXAM_DRAFT_KEY);
}
