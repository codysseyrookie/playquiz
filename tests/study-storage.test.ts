import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    multiGet: vi.fn(async (keys: string[]) => keys.map((key) => [key, storage.get(key) ?? null])),
    multiSet: vi.fn(async (entries: [string, string][]) => {
      entries.forEach(([key, value]) => storage.set(key, value));
    }),
  },
}));

import { HISTORY_KEY, LIBRARY_KEY, loadStudyStorage, saveStudyStorage } from "../lib/study-storage";

const library = {
  subjects: [{ id: "subject-test", name: "테스트", color: "#3653E8" }],
  problems: [{ id: "problem-test", subjectId: "subject-test", subject: "테스트", label: "객관식", type: "multiple" as const, question: "저장 테스트", choices: ["A", "B"], answer: "A", explanation: "설명" }],
  problemSets: [{ id: "set-test", title: "저장 테스트 세트", subjectId: "subject-test", subject: "테스트", description: "설명", subtitle: "1문제", problemIds: ["problem-test"], accent: "#E8EDFF" }],
};

describe("문제풀이 로컬 저장소", () => {
  beforeEach(() => storage.clear());

  it("문제 세트와 학습 기록을 저장한 뒤 다시 읽는다", async () => {
    const history = [{ id: "result-test", title: "저장 테스트 세트", problemIds: ["problem-test"], submittedAt: "2026-08-17T00:00:00.000Z", durationSeconds: 12, attempts: [], score: 1 }];
    await saveStudyStorage(history, library);

    const restored = await loadStudyStorage();

    expect(restored.history).toEqual(history);
    expect(restored.library).toEqual(library);
    expect(storage.has(HISTORY_KEY)).toBe(true);
    expect(storage.has(LIBRARY_KEY)).toBe(true);
  });

  it("현재 키가 없으면 이전 라이브러리 키에서 문제를 복원한다", async () => {
    storage.set("problem-solving-library-v1", JSON.stringify(library));

    const restored = await loadStudyStorage();

    expect(restored.library).toEqual(library);
  });
});
