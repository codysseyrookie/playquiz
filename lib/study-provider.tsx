import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

import { Attempt, ExamResult, Problem, ProblemSet, Subject, gradeAnswers, problems as seedProblems, problemSets as seedSets, subjects as seedSubjects } from "@/lib/study-data";
import { loadStudyStorage, saveStudyStorage } from "@/lib/study-storage";
import { ParsedProblemSet } from "@/lib/markdown-import";

type NewProblem = Omit<Problem, "id" | "subject" | "acceptedAnswers"> & { acceptedAnswers?: string[]; problemSetId: string };

type StudyContextValue = {
  isReady: boolean;
  storageStatus: "loading" | "ready" | "error";
  activeExamTitle: string;
  activeProblemIds: string[];
  answers: Record<string, string>;
  history: ExamResult[];
  subjects: Subject[];
  libraryProblems: Problem[];
  problemSets: ProblemSet[];
  beginExam: (title: string, problemIds?: string[]) => void;
  setAnswer: (problemId: string, answer: string) => void;
  submitExam: (durationSeconds: number) => ExamResult;
  getProblemAttempt: (problemId: string) => Attempt | undefined;
  addSubject: (name: string) => Subject | undefined;
  addProblemSet: (title: string, subjectId: string, description: string) => ProblemSet | undefined;
  addProblem: (problem: NewProblem) => Problem | undefined;
  deleteProblemSet: (setId: string) => void;
  deleteProblem: (problemId: string) => void;
  importProblemSet: (payload: ParsedProblemSet) => { set: ProblemSet; problemCount: number } | undefined;
};

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activeExamTitle, setActiveExamTitle] = useState("1일차 오전 학습문제");
  const [activeProblemIds, setActiveProblemIds] = useState(seedSets[0].problemIds);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(seedSubjects);
  const [libraryProblems, setLibraryProblems] = useState<Problem[]>(seedProblems);
  const [problemSets, setProblemSets] = useState<ProblemSet[]>(seedSets);

  useEffect(() => {
    let cancelled = false;
    loadStudyStorage().then(({ history: storedHistory, library }) => {
      if (cancelled) return;
      setHistory(storedHistory);
      if (library) {
        setSubjects(library.subjects);
        setLibraryProblems(library.problems);
        setProblemSets(library.problemSets);
        if (library.problemSets[0]) setActiveProblemIds(library.problemSets[0].problemIds);
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

  const value = useMemo<StudyContextValue>(() => ({
    isReady,
    storageStatus,
    activeExamTitle,
    activeProblemIds,
    answers,
    history,
    subjects,
    libraryProblems,
    problemSets,
    beginExam: (title, problemIds = seedSets[0].problemIds) => {
      setActiveExamTitle(title);
      setActiveProblemIds(problemIds);
      setAnswers({});
    },
    setAnswer: (problemId, answer) => setAnswers((current) => ({ ...current, [problemId]: answer })),
    submitExam: (durationSeconds) => {
      const sourceProblems = activeProblemIds.map((id) => libraryProblems.find((problem) => problem.id === id)).filter((problem): problem is Problem => Boolean(problem));
      const attempts = gradeAnswers(answers, sourceProblems);
      const result: ExamResult = { id: `result-${Date.now()}`, title: activeExamTitle, problemIds: activeProblemIds, submittedAt: new Date().toISOString(), durationSeconds, attempts, score: attempts.filter((attempt) => attempt.isCorrect).length };
      setHistory((current) => [result, ...current]);
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
    addProblemSet: (title, subjectId, description) => {
      const subject = subjects.find((item) => item.id === subjectId);
      const trimmed = title.trim();
      if (!subject || !trimmed) return undefined;
      const set: ProblemSet = { id: `set-${Date.now()}`, title: trimmed, subjectId, subject: subject.name, description: description.trim() || "직접 만든 문제 세트", subtitle: "새 문제 세트", problemIds: [], accent: subject.color, isCustom: true };
      setProblemSets((current) => [...current, set]);
      return set;
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
    importProblemSet: (payload) => {
      if (!payload.title.trim() || payload.problems.length === 0) return undefined;
      const existingSubject = subjects.find((subject) => subject.name === payload.subjectName);
      const subject = existingSubject ?? { id: `subject-import-${Date.now()}`, name: payload.subjectName || "가져온 문제", color: "#3653E8" };
      const baseId = Date.now();
      const importedProblems: Problem[] = payload.problems.map((item, index) => ({ ...item, id: `problem-import-${baseId}-${index}`, subjectId: subject.id, subject: subject.name }));
      const set: ProblemSet = { id: `set-import-${baseId}`, title: payload.title, subjectId: subject.id, subject: subject.name, description: payload.description, subtitle: `${importedProblems.length}문제 · Markdown 가져오기`, problemIds: importedProblems.map((problem) => problem.id), accent: subject.color, isCustom: true };
      if (!existingSubject) setSubjects((current) => [...current, subject]);
      setLibraryProblems((current) => [...current, ...importedProblems]);
      setProblemSets((current) => [...current, set]);
      return { set, problemCount: importedProblems.length };
    },
  }), [activeExamTitle, activeProblemIds, answers, history, subjects, libraryProblems, problemSets, isReady, storageStatus]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy must be used within StudyProvider");
  return context;
}
