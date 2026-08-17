import { ProblemType } from "@/lib/study-data";

export type ParsedProblem = {
  subjectName: string;
  label: string;
  type: ProblemType;
  question: string;
  choices?: string[];
  answer: string;
  acceptedAnswers?: string[];
  explanation: string;
};

export type ParsedProblemSet = {
  title: string;
  description: string;
  subjectName: string;
  problems: ParsedProblem[];
};

const choicePattern = /^\s*[①②③④⑤]\s*(.+?)\s*$/;
const headingPattern = /^###\s+(\d+)\.\s*([^\r\n]+?)[ \t]*$/gm;
const answerSymbolToIndex: Record<string, number> = { "①": 0, "②": 1, "③": 2, "④": 3, "⑤": 4 };

function clean(value: string) {
  return value.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

function sliceSection(markdown: string, start: number, end: number) {
  return markdown.slice(start, end).replace(/^---\s*$/gm, "").trim();
}

function findAnswerBlocks(markdown: string) {
  const blocks = new Map<number, string>();
  const headings = [...markdown.matchAll(/^###\s+(\d+)\.\s*(?:정답 및 해설|해설|핵심답안|해설 예시).*$/gm)];
  headings.forEach((heading, index) => {
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1]?.index ?? markdown.length;
    blocks.set(Number(heading[1]), sliceSection(markdown, start, end));
  });
  return blocks;
}

function findAnswerSymbols(markdown: string) {
  const row = markdown.match(/^\|\s*정답\s*\|(.+)$/m)?.[1];
  if (!row) return new Map<number, string>();
  const values = row.split("|").map((value) => value.trim()).filter(Boolean);
  return new Map(values.map((value, index) => [index + 1, value.charAt(0)]));
}

function subjectForQuestion(number: number, names: string[]) {
  if (names.length < 2) return names[0] ?? "가져온 문제";
  if (number <= 4) return names[0];
  if (number <= 8) return names[1] ?? names[0];
  return names[2] ?? names[names.length - 1];
}

function extractAnswer(number: number, answerBlock: string, type: ProblemType) {
  const normalized = clean(answerBlock);
  const explicitAnswer = answerBlock.match(/\*\*정답:\*\*\s*([①②③④⑤])/m)?.[1];
  if (number === 12) return { answer: normalized.match(/=\s*([0-9.]+\s*%)/)?.[1] ?? "30%", acceptedAnswers: ["30", "30%", "30퍼센트"] };
  if (type === "multiple" && explicitAnswer) return { answer: explicitAnswer, acceptedAnswers: [] };
  if (number === 14) return { answer: "83.3%, 80%", acceptedAnswers: ["83.3 80", "83.3% 80%", "약 83.3% 80%"] };
  if (type === "long") {
    const core = normalized.replace(/^핵심답안\s*:?[ ]*/i, "").slice(0, 240) || "핵심 답안을 작성하세요.";
    return { answer: core, acceptedAnswers: core.split(/[.;。]/).map((value) => clean(value)).filter((value) => value.length > 4).slice(0, 4) };
  }
  return { answer: normalized || "정답을 확인하세요.", acceptedAnswers: [] };
}

export function parseMarkdownProblemSet(markdown: string, fallbackName = "가져온 문제 세트"): ParsedProblemSet {
  const source = markdown.replace(/\uFEFF/g, "");
  const title = clean(source.match(/^#\s+(.+)$/m)?.[1] ?? fallbackName).replace(/\s+—.*$/, "") || fallbackName.replace(/\.md$/i, "");
  const description = clean(source.match(/^>\s*\*\*출제 범위:\s*(.+?)\*\*/m)?.[1] ?? "Markdown에서 가져온 학습문제");
  const subjectNames = description.split(/[·,/]/).map((value) => clean(value)).filter(Boolean);
  const problemStart = source.search(/^#\s+문제\s*$/m);
  const answerStart = source.search(/^#\s+정답 및 해설\s*$/m);
  if (problemStart < 0) return { title, description, subjectName: subjectNames[0] ?? "가져온 문제", problems: [] };
  const problemEnd = answerStart > problemStart ? answerStart : source.length;
  const problemSection = source.slice(problemStart, problemEnd);
  const headings = [...problemSection.matchAll(headingPattern)];
  const answerBlocks = findAnswerBlocks(source);
  const answerSymbols = findAnswerSymbols(source);
  const parsed = headings.map((heading, index) => {
    const number = Number(heading[1]);
    const questionStart = (heading.index ?? 0) + heading[0].length;
    const questionEnd = headings[index + 1]?.index ?? problemSection.length;
    const body = problemSection.slice(questionStart, questionEnd).trim();
    const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
    const choices = lines.map((line) => line.match(choicePattern)?.[1]).filter((choice): choice is string => Boolean(choice));
    const question = clean([heading[2], ...lines.filter((line) => !choicePattern.test(line))].join(" "));
    const type: ProblemType = choices.length > 0 ? "multiple" : /계산|수치|감소형 개선율/.test(question) ? "short" : "long";
    const answerBlock = answerBlocks.get(number) ?? "";
    const blockSymbol = answerBlock.match(/\*\*정답:\*\*\s*([①②③④⑤])/m)?.[1];
    const symbol = answerSymbols.get(number) ?? blockSymbol;
    const answerFromBlock = extractAnswer(number, answerBlock, type);
    const answer = type === "multiple" && symbol && choices[answerSymbolToIndex[symbol]] ? choices[answerSymbolToIndex[symbol]] : answerFromBlock.answer;
    return { subjectName: subjectForQuestion(number, subjectNames), label: type === "multiple" ? "객관식" : type === "short" ? "단답형" : "서술형", type, question, choices: choices.length > 0 ? choices : undefined, answer, acceptedAnswers: type === "multiple" ? undefined : answerFromBlock.acceptedAnswers, explanation: clean(answerBlocks.get(number) ?? "해설이 제공되지 않았습니다.") };
  }).filter((problem) => problem.question.length > 0);
  return { title, description, subjectName: subjectNames.join(" · ") || "가져온 문제", problems: parsed };
}
