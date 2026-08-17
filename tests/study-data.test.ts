import { describe, expect, it } from "vitest";

import { gradeAnswers, normalizeAnswer, problems, problemSets } from "../lib/study-data";

describe("답안 채점 규칙", () => {
  it("단답형 답안의 공백과 대소문자 차이를 정규화한다", () => {
    expect(normalizeAnswer("  대 류 ")).toBe("대류");
    expect(normalizeAnswer(" Went ")).toBe("went");
  });

  it("각 문제에 채점에 필요한 정답과 해설이 있다", () => {
    expect(problems).toHaveLength(14);
    expect(problems.every((problem) => problem.answer.length > 0 && problem.explanation.length > 0)).toBe(true);
  });

  it("첨부 학습자료의 14문항이 첫 문제 세트에 연결되어 있다", () => {
    expect(problemSets[0].problemIds).toHaveLength(14);
    expect(problemSets[0].problemIds).toEqual(problems.map((problem) => problem.id));
  });

  it("시험의 답안을 채점해 정답·오답 및 미응답을 구분한다", () => {
    const attempts = gradeAnswers({
      "day1-q1": "도구는 도입했지만 업무와 의사결정이 바뀌지 않아 DX가 완성됐다고 보기 어렵다.",
      "day1-q12": "30%",
      "day1-q14": "83.3%, 80%",
    });

    expect(attempts.filter((attempt) => attempt.isCorrect)).toHaveLength(3);
    expect(attempts.find((attempt) => attempt.problemId === "day1-q1")?.isCorrect).toBe(true);
    expect(attempts.find((attempt) => attempt.problemId === "day1-q12")?.isCorrect).toBe(true);
    expect(attempts.find((attempt) => attempt.problemId === "day1-q14")?.isCorrect).toBe(true);
    expect(attempts.find((attempt) => attempt.problemId === "day1-q2")?.answer).toBe("");
  });
});
