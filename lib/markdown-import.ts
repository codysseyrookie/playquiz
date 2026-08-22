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

type AnswerBlock = {
  heading: string;
  body: string;
};

const choicePattern = /^\s*[①②③④⑤]\s*(.+?)\s*$/;
const headingPattern = /^###\s+(\d+)\.\s*([^\r\n]+?)[ \t]*$/gm;
const answerHeadingPattern = /^###\s+(\d+)\.\s*(정답 및 해설|해설 예시|핵심답안|해설).*$/gm;
const answerFieldPattern = /^\*\*(유형|정답|허용 답안|해설|예시 답안)\s*:\*\*\s*/gm;
const answerSymbolToIndex: Record<string, number> = { "①": 0, "②": 1, "③": 2, "④": 3, "⑤": 4 };

function clean(value: string) {
  return value.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

function cleanAnswerValue(value: string) {
  return clean(value.replace(/`/g, "").replace(/\*\*/g, ""));
}

function sliceSection(markdown: string, start: number, end: number) {
  return markdown.slice(start, end).replace(/^---\s*$/gm, "").trim();
}

function extractQuotedMetadata(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wholeValueBold = new RegExp(`^>\\s*\\*\\*${escapedLabel}\\s*:\\s*(.+?)\\*\\*\\s*$`, "m");
  const labelOnlyBold = new RegExp(`^>\\s*\\*\\*${escapedLabel}\\s*:\\*\\*\\s*(.+?)\\s*$`, "m");
  return clean(markdown.match(labelOnlyBold)?.[1] ?? markdown.match(wholeValueBold)?.[1] ?? "");
}

function findAnswerBlocks(markdown: string) {
  const blocks = new Map<number, AnswerBlock>();
  const headings = [...markdown.matchAll(answerHeadingPattern)];
  headings.forEach((heading, index) => {
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1]?.index ?? markdown.length;
    blocks.set(Number(heading[1]), { heading: heading[2], body: sliceSection(markdown, start, end) });
  });
  return blocks;
}

function findAnswerFields(answerBlock: string) {
  const fields = new Map<string, string>();
  const matches = [...answerBlock.matchAll(answerFieldPattern)];
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? answerBlock.length;
    fields.set(match[1], answerBlock.slice(start, end).trim());
  });
  return fields;
}

function findAnswerSymbols(markdown: string) {
  const row = markdown.match(/^\|\s*정답\s*\|(.+)$/m)?.[1];
  if (!row) return new Map<number, string>();
  const values = row.split("|").map((value) => value.trim()).filter(Boolean);
  return new Map(values.map((value, index) => [index + 1, value.charAt(0)]));
}

function parseProblemType(value: string | undefined) {
  const normalized = clean(value ?? "");
  if (/객관식|선택형|multiple/i.test(normalized)) return "multiple" as const;
  if (/단답형|단답식|short/i.test(normalized)) return "short" as const;
  if (/서술형|논술형|long/i.test(normalized)) return "long" as const;
  return undefined;
}

function inferProblemType(question: string, choices: string[], answerText: string): ProblemType {
  if (choices.length > 0) return "multiple";
  const asksForShortAnswer = /계산|구하|수치|몇\s*%|한\s*단어|짧게|간단히/.test(question);
  const asksForExtendedAnswer = /종합|연결해|비교조건|기능\s*사용|외부요인|지원\s*분야|실행조건/.test(question);
  if (asksForShortAnswer && !asksForExtendedAnswer && clean(answerText).length <= 260) return "short";
  return "long";
}

function subjectForQuestion(number: number, names: string[]) {
  if (names.length < 2) return names[0] ?? "가져온 문제";
  if (number <= 4) return names[0];
  if (number <= 8) return names[1] ?? names[0];
  return names[2] ?? names[names.length - 1];
}

function extractPercentages(value: string) {
  const matches = [...value.matchAll(/(?:약\s*)?([0-9]+(?:\.[0-9]+)?)\s*%/g)].map((match) => `${match[1]}%`);
  return [...new Set(matches)];
}

function extractAcceptedAnswers(value: string | undefined) {
  if (!value) return [];
  return value.split("|").map(cleanAnswerValue).filter(Boolean);
}

function parseAnswer(answerBlock: AnswerBlock | undefined, type: ProblemType) {
  const body = answerBlock?.body ?? "";
  const fields = findAnswerFields(body);
  const explicitAnswer = cleanAnswerValue(fields.get("정답") ?? "");
  const exampleAnswer = cleanAnswerValue(fields.get("예시 답안") ?? "");
  const legacyAnswer = /핵심답안|해설 예시/.test(answerBlock?.heading ?? "") ? cleanAnswerValue(body) : "";
  const answerSource = explicitAnswer || exampleAnswer || legacyAnswer;
  const explanationField = cleanAnswerValue(fields.get("해설") ?? "");
  const explanation = explanationField
    || (/^해설$/.test(answerBlock?.heading ?? "") ? cleanAnswerValue(body) : "")
    || answerSource
    || "해설이 제공되지 않았습니다.";
  const acceptedAnswers = extractAcceptedAnswers(fields.get("허용 답안"));
  const percentages = extractPercentages(answerSource);

  if (type === "short" && !explicitAnswer && percentages.length === 1) {
    const percent = percentages[0];
    const number = percent.replace(/%$/, "");
    return { answer: percent, acceptedAnswers: [...new Set([...acceptedAnswers, number, percent, `${number}퍼센트`])], explanation };
  }

  if (type === "long" && percentages.length > 1) {
    acceptedAnswers.push(percentages.join(" "));
  }

  return {
    answer: answerSource || (type === "multiple" ? "" : explanation),
    acceptedAnswers: [...new Set(acceptedAnswers)],
    explanation,
  };
}

function isQuestionContentLine(line: string) {
  const trimmed = line.trim();
  return Boolean(trimmed)
    && !/^---\s*$/.test(trimmed)
    && !/^<[^>]+>\s*$/.test(trimmed)
    && !/^>/.test(trimmed);
}

export function parseMarkdownProblemSet(markdown: string, fallbackName = "가져온 문제 세트"): ParsedProblemSet {
  const source = markdown.replace(/\uFEFF/g, "");
  const titleHeading = [...source.matchAll(/^#\s+(.+)$/gm)]
    .find((heading) => !/^(?:문제|정답 및 해설)\s*$/.test(clean(heading[1])));
  const fallbackTitle = fallbackName.replace(/\.md$/i, "").replace(/_/g, " ");
  const title = clean(titleHeading?.[1] ?? fallbackTitle).replace(/\s+—.*$/, "") || "가져온 문제 세트";
  const lectureName = extractQuotedMetadata(source, "강의명");
  const scope = extractQuotedMetadata(source, "출제 범위");
  const description = scope || lectureName || "Markdown에서 가져온 학습문제";
  const subjectSource = lectureName || scope || title.replace(/\s*학습문제\s*$/, "");
  const subjectNames = subjectSource.split(/[·,/]/).map((value) => clean(value)).filter(Boolean);
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
    const lines = body.split("\n").map((line) => line.trim()).filter(isQuestionContentLine);
    const choices = lines.map((line) => line.match(choicePattern)?.[1]).filter((choice): choice is string => Boolean(choice));
    const question = clean([heading[2], ...lines.filter((line) => !choicePattern.test(line))].join(" "));
    const answerBlock = answerBlocks.get(number);
    const answerFields = findAnswerFields(answerBlock?.body ?? "");
    const preliminaryAnswer = answerFields.get("정답") ?? answerFields.get("예시 답안") ?? answerBlock?.body ?? "";
    const type = parseProblemType(answerFields.get("유형")) ?? inferProblemType(question, choices, preliminaryAnswer);
    const blockSymbol = answerFields.get("정답")?.match(/[①②③④⑤]/)?.[0];
    const symbol = answerSymbols.get(number) ?? blockSymbol;
    const parsedAnswer = parseAnswer(answerBlock, type);
    const answer = type === "multiple" && symbol && choices[answerSymbolToIndex[symbol]]
      ? choices[answerSymbolToIndex[symbol]]
      : parsedAnswer.answer;
    return {
      subjectName: subjectForQuestion(number, subjectNames),
      label: type === "multiple" ? "객관식" : type === "short" ? "단답형" : "서술형",
      type,
      question,
      choices: choices.length > 0 ? choices : undefined,
      answer,
      acceptedAnswers: type === "multiple" || parsedAnswer.acceptedAnswers.length === 0 ? undefined : parsedAnswer.acceptedAnswers,
      explanation: parsedAnswer.explanation,
    };
  }).filter((problem) => problem.question.length > 0 && problem.answer.length > 0);

  return {
    title,
    description,
    subjectName: lectureName || subjectNames.join(" · ") || "가져온 문제",
    problems: parsed,
  };
}
