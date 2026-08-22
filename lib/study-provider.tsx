import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { AnswerCheckMode, Attempt, ExamResult, Problem, ProblemSet, Subject, gradeAnswers, problems as seedProblems, problemSets as seedSets, resolveAnswerCheckMode, subjects as seedSubjects } from "@/lib/study-data";
import { HISTORY_KEY, LIBRARY_KEY, clearExamDraft, loadStudyStorage, saveExamDraft, saveStudyStorage } from "@/lib/study-storage";
import { ParsedProblemSet } from "@/lib/markdown-import";

type NewProblem = Omit<Problem, "id" | "subject" | "acceptedAnswers"> & { acceptedAnswers?: string[]; problemSetId: string };

type StudyContextValue = {
  isReady: boolean;
  storageStatus: "loading" | "ready" | "error";
  hasActiveExam: boolean;
  activeExamTitle: string;
  activeProblemIds: string[];
  answers: Record<string, string>;
  checkedProblemIds: string[];
  activeAnswerCheckMode: AnswerCheckMode;
  activeQuestionIndex: number;
  elapsedSeconds: number;
  history: ExamResult[];
  subjects: Subject[];
  libraryProblems: Problem[];
  problemSets: ProblemSet[];
  beginExam: (title: string, problemIds?: string[], answerCheckMode?: AnswerCheckMode) => void;
  setAnswer: (problemId: string, answer: string) => void;
  checkAnswer: (problemId: string) => void;
  setActiveQuestionIndex: (index: number) => void;
  advanceExamTime: () => void;
  submitExam: (durationSeconds: number) => ExamResult;
  getProblemAttempt: (problemId: string) => Attempt | undefined;
  addSubject: (name: string) => Subject | undefined;
  addProblemSet: (title: string, subjectId: string, description: string, answerCheckMode?: AnswerCheckMode) => ProblemSet | undefined;
  setProblemSetAnswerCheckMode: (setId: string, answerCheckMode: AnswerCheckMode) => void;
  addProblem: (problem: NewProblem) => Problem | undefined;
  deleteProblemSet: (setId: string) => void;
  deleteProblem: (problemId: string) => void;
  importProblemSet: (payload: ParsedProblemSet, answerCheckMode?: AnswerCheckMode) => { set: ProblemSet; problemCount: number } | undefined;
};

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activeExamTitle, setActiveExamTitle] = useState("1일차 오전 학습문제");
  const [activeProblemIds, setActiveProblemIds] = useState(seedSets[0].problemIds);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkedProblemIds, setCheckedProblemIds] = useState<string[]>([]);
  const [activeAnswerCheckMode, setActiveAnswerCheckMode] = useState<AnswerCheckMode>("question");
  const [activeQuestionIndex, setActiveQuestionIndexState] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasActiveExam, setHasActiveExam] = useState(false);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(seedSubjects);
  const [libraryProblems, setLibraryProblems] = useState<Problem[]>(seedProblems);
  const [problemSets, setProblemSets] = useState<ProblemSet[]>(seedSets);

  const syncStoredStudy = useCallback(async () => {
    try {
      const stored = await loadStudyStorage();
      if (stored.library) {
        const currentLibrary = JSON.stringify({ subjects, problems: libraryProblems, problemSets });
        if (JSON.stringify(stored.library) !== currentLibrary) {
          setSubjects(stored.library.subjects);
          setLibraryProblems(stored.library.problems);
          setProblemSets(stored.library.problemSets);
        }
      }
      if (JSON.stringify(stored.history) !== JSON.stringify(history)) setHistory(stored.history);
    } catch {
      setStorageStatus("error");
    }
  }, [history, subjects, libraryProblems, problemSets]);

  useEffect(() => {
    let cancelled = false;
    loadStudyStorage().then(({ history: storedHistory, library, examDraft }) => {
      if (cancelled) return;
      setHistory(storedHistory);
      const availableProblems = library?.problems ?? seedProblems;
      if (library) {
        setSubjects(library.subjects);
        setLibraryProblems(library.problems);
        setProblemSets(library.problemSets);
        if (library.problemSets[0]) setActiveProblemIds(library.problemSets[0].problemIds);
      }
      if (examDraft) {
        const validProblemIds = examDraft.problemIds.filter((id) => availableProblems.some((problem) => problem.id === id));
        if (validProblemIds.length > 0) {
          const validAnswers = Object.fromEntries(Object.entries(examDraft.answers).filter(([id]) => validProblemIds.includes(id)));
          setActiveExamTitle(examDraft.title);
          setActiveProblemIds(validProblemIds);
          setAnswers(validAnswers);
          setCheckedProblemIds(examDraft.checkedProblemIds.filter((id) => validProblemIds.includes(id) && Boolean(validAnswers[id]?.trim())));
          setActiveAnswerCheckMode(examDraft.answerCheckMode);
          setActiveQuestionIndexState(Math.min(examDraft.questionIndex, validProblemIds.length - 1));
          setElapsedSeconds(examDraft.elapsedSeconds);
          setHasActiveExam(true);
        }
      }
      setStorageStatus("ready");
      setIsReady(true);
    }).catch(() => {
      if (cancelled) return;
      setStorageStatus("error");
      setIsReady(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (storageStatus !== "ready") return;
    saveStudyStorage(history, { subjects, problems: libraryProblems, problemSets }).catch(() => setStorageStatus("error"));
  }, [history, subjects, libraryProblems, problemSets, storageStatus]);

  useEffect(() => {
    if (!isReady || Platform.OS !== "web") return;
    const syncWhenVisible = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") void syncStoredStudy();
    };
    const syncChangedStorage = (event: StorageEvent) => {
      if (!event.key || event.key === LIBRARY_KEY || event.key === HISTORY_KEY) void syncStoredStudy();
    };
    window.addEventListener("focus", syncWhenVisible);
    window.addEventListener("storage", syncChangedStorage);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.removeEventListener("focus", syncWhenVisible);
      window.removeEventListener("storage", syncChangedStorage);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [isReady, syncStoredStudy]);

  useEffect(() => {
    if (storageStatus !== "ready") return;
    const storageOperation = hasActiveExam
      ? saveExamDraft({ title: activeExamTitle, problemIds: activeProblemIds, answers, checkedProblemIds, answerCheckMode: activeAnswerCheckMode, questionIndex: activeQuestionIndex, elapsedSeconds })
      : clearExamDraft();
    storageOperation.catch(() => setStorageStatus("error"));
  }, [activeExamTitle, activeProblemIds, answers, checkedProblemIds, activeAnswerCheckMode, activeQuestionIndex, elapsedSeconds, hasActiveExam, storageStatus]);

  const advanceExamTime = useCallback(() => {
    setElapsedSeconds((current) => current + 1);
    setHasActiveExam(true);
  }, []);

  const value = useMemo<StudyContextValue>(() => ({
    isReady,
    storageStatus,
    hasActiveExam,
    activeExamTitle,
    activeProblemIds,
    answers,
    checkedProblemIds,
    activeAnswerCheckMode,
    activeQuestionIndex,
    elapsedSeconds,
    history,
    subjects,
    libraryProblems,
    problemSets,
    beginExam: (title, problemIds = seedSets[0].problemIds, answerCheckMode = "question") => {
      setActiveExamTitle(title);
      setActiveProblemIds(problemIds);
      setAnswers({});
      setCheckedProblemIds([]);
      setActiveAnswerCheckMode(resolveAnswerCheckMode(answerCheckMode));
      setActiveQuestionIndexState(0);
      setElapsedSeconds(0);
      setHasActiveExam(true);
    },
    setAnswer: (problemId, answer) => {
      if (activeAnswerCheckMode === "question" && checkedProblemIds.includes(problemId)) return;
      setAnswers((current) => ({ ...current, [problemId]: answer }));
      setHasActiveExam(true);
    },
    checkAnswer: (problemId) => {
      if (activeAnswerCheckMode !== "question" || !answers[problemId]?.trim()) return;
      setCheckedProblemIds((current) => current.includes(problemId) ? current : [...current, problemId]);
      setHasActiveExam(true);
    },
    setActiveQuestionIndex: (index) => {
      setActiveQuestionIndexState(Math.max(0, Math.min(index, Math.max(0, activeProblemIds.length - 1))));
      setHasActiveExam(true);
    },
    advanceExamTime,
    submitExam: (durationSeconds) => {
      const sourceProblems = activeProblemIds.map((id) => libraryProblems.find((problem) => problem.id === id)).filter((problem): problem is Problem => Boolean(problem));
      const attempts = gradeAnswers(answers, sourceProblems);
      const result: ExamResult = { id: `result-${Date.now()}`, title: activeExamTitle, problemIds: activeProblemIds, submittedAt: new Date().toISOString(), durationSeconds, attempts, score: attempts.filter((attempt) => attempt.isCorrect).length };
      setHistory((current) => [result, ...current]);
      setAnswers({});
      setCheckedProblemIds([]);
      setActiveQuestionIndexState(0);
      setElapsedSeconds(0);
      setHasActiveExam(false);
      return result;
    },
    getProblemAttempt: (problemId) => history[0]?.attempts.find((attempt) => attempt.problemId === problemId),
    addSubject: (name) => {
      const trimmed = name.trim();
      if (!trimmed || subjects.some((subject) => subject.name === trimmed)) return undefined;
      const colors = ["#3653E8", "#0F9F78", "#E45A4E", "#D98221"];
      const subject: Subject = { id: `subject-${Date.now()}`, name: trimmed, color: colors[subjects.length % colors.length] };
      setSubjects((current) => [...current, subject]);
      return subject;
    },
    addProblemSet: (title, subjectId, description, answerCheckMode = "question") => {
      const subject = subjects.find((item) => item.id === subjectId);
      const trimmed = title.trim();
      if (!subject || !trimmed) return undefined;
      const set: ProblemSet = { id: `set-${Date.now()}`, title: trimmed, subjectId, subject: subject.name, description: description.trim() || "직접 만든 문제 세트", subtitle: "새 문제 세트", problemIds: [], accent: subject.color, isCustom: true, answerCheckMode: resolveAnswerCheckMode(answerCheckMode) };
      setProblemSets((current) => [...current, set]);
      return set;
    },
    setProblemSetAnswerCheckMode: (setId, answerCheckMode) => {
      setProblemSets((current) => current.map((set) => set.id === setId ? { ...set, answerCheckMode: resolveAnswerCheckMode(answerCheckMode) } : set));
    },
    addProblem: (input) => {
      const subject = subjects.find((item) => item.id === input.subjectId);
      if (!subject || !input.question.trim() || !input.answer.trim()) return undefined;
      const { problemSetId, ...problemInput } = input;
      const problem: Problem = { ...problemInput, id: `problem-${Date.now()}`, subject: subject.name, question: input.question.trim(), answer: input.answer.trim(), explanation: input.explanation.trim() || "정답과 핵심 개념을 다시 확인해 보세요." };
      setLibraryProblems((current) => [...current, problem]);
      setProblemSets((current) => current.map((set) => set.id === problemSetId ? { ...set, problemIds: [...set.problemIds, problem.id] } : set));
      return problem;
    },
    deleteProblemSet: (setId) => setProblemSets((current) => current.filter((set) => set.id !== setId)),
    deleteProblem: (problemId) => {
      setLibraryProblems((current) => current.filter((problem) => problem.id !== problemId));
      setProblemSets((current) => current.map((set) => ({ ...set, problemIds: set.problemIds.filter((id) => id !== problemId) })));
    },
    importProblemSet: (payload, answerCheckMode = "question") => {
      if (!payload.title.trim() || payload.problems.length === 0) return undefined;
      const existingSubject = subjects.find((subject) => subject.name === payload.subjectName);
      const subject = existingSubject ?? { id: `subject-import-${Date.now()}`, name: payload.subjectName || "가져온 문제", color: "#3653E8" };
      const baseId = Date.now();
      const importedProblems: Problem[] = payload.problems.map((item, index) => ({ ...item, id: `problem-import-${baseId}-${index}`, subjectId: subject.id, subject: subject.name }));
      const set: ProblemSet = { id: `set-import-${baseId}`, title: payload.title, subjectId: subject.id, subject: subject.name, description: payload.description, subtitle: `${importedProblems.length}문제 · Markdown 가져오기`, problemIds: importedProblems.map((problem) => problem.id), accent: subject.color, isCustom: true, answerCheckMode: resolveAnswerCheckMode(answerCheckMode) };
      if (!existingSubject) setSubjects((current) => [...current, subject]);
      setLibraryProblems((current) => [...current, ...importedProblems]);
      setProblemSets((current) => [...current, set]);
      return { set, problemCount: importedProblems.length };
    },
  }), [activeExamTitle, activeProblemIds, answers, checkedProblemIds, activeAnswerCheckMode, activeQuestionIndex, elapsedSeconds, hasActiveExam, history, subjects, libraryProblems, problemSets, isReady, storageStatus, advanceExamTime]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy must be used within StudyProvider");
  return context;
}
