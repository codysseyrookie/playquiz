import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseMarkdownProblemSet } from "../lib/markdown-import";

const source = readFileSync(join(process.cwd(), "tests/fixtures/day1-morning.md"), "utf8");
const updatedSource = readFileSync(join(process.cwd(), "tests/fixtures/day1-morning-260816.md"), "utf8");

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
});
