import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseMarkdownProblemSet } from "../lib/markdown-import";
import { gradeAnswers, Problem } from "../lib/study-data";

const source = readFileSync(join(process.cwd(), "tests/fixtures/day1-morning.md"), "utf8");
const updatedSource = readFileSync(join(process.cwd(), "tests/fixtures/day1-morning-260816.md"), "utf8");
const promptFormatSource = readFileSync(join(process.cwd(), "tests/fixtures/prompt-format-dynamic.md"), "utf8");

describe("Markdown 문제 세트 가져오기", () => {
  it("실제 학습문제 파일을 14문항 세트로 파싱한다", () => {
    const parsed = parseMarkdownProblemSet(source, "day1-morning.md");
    expect(parsed.title).toContain("1일차 오전 학습문제");
    expect(parsed.problems).toHaveLength(14);
    expect(parsed.problems[0].type).toBe("multiple");
    expect(parsed.problems[10].type).toBe("long");
    expect(parsed.problems[11].type).toBe("short");
    expect(parsed.problems[11].answer).toBe("30%");
    expect(parsed.problems[13].acceptedAnswers).toContain("83.3% 80%");
    expect(parsed.problems.every((problem) => problem.question && problem.answer && problem.explanation)).toBe(true);
  });

  it("260816 첨부 파일의 변경된 정답 해설 형식도 가져온다", () => {
    const parsed = parseMarkdownProblemSet(updatedSource, "1일차_오전_학습문제_260816.md");
    expect(parsed.title).toContain("1일차 오전 학습문제");
    expect(parsed.problems).toHaveLength(14);
    expect(parsed.problems[0].type).toBe("multiple");
    expect(parsed.problems[0].answer).toContain("주문부터 출하까지");
    expect(parsed.problems[9].answer).toContain("개선은 확인하되");
    expect(parsed.problems[11].answer).toBe("30%");
    expect(parsed.problems[13].acceptedAnswers).toContain("83.3% 80%");
  });

  it("새 프롬프트 형식의 강의명과 가변 문항 구성을 그대로 가져온다", () => {
    const parsed = parseMarkdownProblemSet(promptFormatSource, "3일차_오전_스마트제조_데이터_활용.pdf");
    expect(parsed.title).toBe("3일차 오전 스마트제조 데이터 활용 학습문제");
    expect(parsed.subjectName).toBe("3일차_오전_스마트제조_데이터_활용");
    expect(parsed.description).toBe("3일차_오전_스마트제조_데이터_활용");
    expect(parsed.problems).toHaveLength(5);
    expect(parsed.problems.map((problem) => problem.type)).toEqual(["multiple", "multiple", "short", "short", "long"]);
    expect(parsed.problems[0].answer).toBe("동일한 항목을 같은 의미와 단위로 비교하기 위해서다.");
    expect(parsed.problems[2].answer).toBe("데이터 표준화");
    expect(parsed.problems[2].acceptedAnswers).toEqual(["데이터표준화", "데이터의 표준화"]);
    expect(parsed.problems[3].answer).toBe("42%");
    expect(parsed.problems[3].acceptedAnswers).toContain("42퍼센트");
    expect(parsed.problems[4].acceptedAnswers).toContain("지원 전후 측정조건을 통일하고 복수의 현장 증거를 확인한다.");
    expect(parsed.problems[4].explanation).toContain("직접 비교하기 어렵다");

    const gradeableProblems: Problem[] = parsed.problems.map((problem, index) => ({
      ...problem,
      id: `prompt-${index + 1}`,
      subjectId: "prompt-subject",
      subject: parsed.subjectName,
    }));
    const attempts = gradeAnswers({
      "prompt-1": "동일한 항목을 같은 의미와 단위로 비교하기 위해서다.",
      "prompt-2": "센서값의 기준과 누락 여부",
      "prompt-3": "데이터의 표준화",
      "prompt-4": "42퍼센트",
      "prompt-5": "지원 전후 측정조건을 통일하고 복수의 현장 증거를 확인한다.",
    }, gradeableProblems);
    expect(attempts.every((attempt) => attempt.isCorrect)).toBe(true);
  });

  it("문항 번호와 관계없이 명시된 정답을 사용한다", () => {
    const numberedSource = `# 번호 고정값 제거 확인 학습문제

> **강의명: 번호 고정값 제거 확인**

# 문제

${Array.from({ length: 14 }, (_, index) => `### ${index + 1}. ${index + 1}번 값을 쓰시오.`).join("\n\n")}

# 정답 및 해설

${Array.from({ length: 14 }, (_, index) => `### ${index + 1}. 정답 및 해설

**유형:** 단답형

**정답:** 값-${index + 1}

**허용 답안:** 대체-${index + 1}

**해설:** ${index + 1}번 해설`).join("\n\n")}`;
    const parsed = parseMarkdownProblemSet(numberedSource, "numbered.md");
    expect(parsed.problems).toHaveLength(14);
    expect(parsed.problems[11].answer).toBe("값-12");
    expect(parsed.problems[13].answer).toBe("값-14");
    expect(parsed.problems[13].acceptedAnswers).toEqual(["대체-14"]);
  });
});
