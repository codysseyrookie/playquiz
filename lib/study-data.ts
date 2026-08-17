export type ProblemType = "multiple" | "short" | "long";

export type Subject = {
  id: string;
  name: string;
  color: string;
};

export type Problem = {
  id: string;
  subjectId: string;
  subject: string;
  label: string;
  type: ProblemType;
  question: string;
  choices?: string[];
  answer: string;
  acceptedAnswers?: string[];
  explanation: string;
};

export type ProblemSet = {
  id: string;
  title: string;
  subjectId: string;
  subject: string;
  description: string;
  subtitle: string;
  problemIds: string[];
  accent: string;
  isCustom?: boolean;
};

export type Attempt = {
  problemId: string;
  answer: string;
  isCorrect: boolean;
};

export type ExamResult = {
  id: string;
  title: string;
  problemIds: string[];
  submittedAt: string;
  durationSeconds: number;
  attempts: Attempt[];
  score: number;
};

export const subjects: Subject[] = [
  { id: "dx", name: "디지털 전환", color: "#3653E8" },
  { id: "diagnosis", name: "현장 진단", color: "#0F9F78" },
  { id: "performance", name: "성과관리", color: "#E45A4E" },
];

export const problems: Problem[] = [
  { id: "day1-q1", subjectId: "dx", subject: "디지털 전환", label: "개념 구분", type: "multiple", question: "한 업체가 ERP를 설치했지만 주문서를 출력한 뒤 전화와 구두지시로 생산순서를 정하고 있다. 고객 납기나 재고 변화도 의사결정에 자동 반영되지 않는다. 가장 적절한 판단은?", choices: ["ERP가 있으므로 디지털 전환이 완성되었다.", "도구는 도입했지만 업무와 의사결정이 바뀌지 않아 DX가 완성됐다고 보기 어렵다.", "종이 출력이 있으므로 모든 디지털 데이터가 무효다.", "최신 ERP로 교체하면 별도의 업무변화 없이 DX가 완성된다."], answer: "도구는 도입했지만 업무와 의사결정이 바뀌지 않아 DX가 완성됐다고 보기 어렵다.", explanation: "ERP 보유만으로 DX가 완성되지는 않습니다. 데이터가 업무순서와 의사결정, 고객가치의 변화로 연결되어야 합니다." },
  { id: "day1-q2", subjectId: "dx", subject: "디지털 전환", label: "발전단계", type: "multiple", question: "디지털 전환의 발전단계와 사례의 연결이 가장 적절한 것은?", choices: ["Digitization-예측생산, Digitalization-PDF 변환, Transformation-중복입력", "Digitization-AI 발주, Digitalization-수기결재, Transformation-모니터 교체", "세 단계는 모두 장비 자동화 수준만으로 구분한다.", "Digitization-종이도면의 PDF화, Digitalization-주문·재고 연동, Transformation-데이터 기반 맞춤생산"], answer: "Digitization-종이도면의 PDF화, Digitalization-주문·재고 연동, Transformation-데이터 기반 맞춤생산", explanation: "Digitization은 아날로그 정보의 디지털 변환, Digitalization은 업무의 디지털 효율화, Transformation은 운영과 가치의 재설계입니다." },
  { id: "day1-q3", subjectId: "dx", subject: "디지털 전환", label: "밸류체인", type: "multiple", question: "교안에서 설명한 데이터 밸류체인의 순환으로 가장 적절한 것은?", choices: ["수집 → 분석 → 적용 → 환류", "분석 → 폐기 → 구매 → 홍보", "적용 → 수집 → 중단 → 삭제", "장비 도입 → 교육 → 종료 → 성과 확정"], answer: "수집 → 분석 → 적용 → 환류", explanation: "데이터를 수집하고 분석한 뒤 작업에 적용하며, 실행 결과를 다시 표준과 기획 개선에 환류합니다." },
  { id: "day1-q4", subjectId: "dx", subject: "디지털 전환", label: "AI 운영", type: "multiple", question: "단발성 AI 활용과 학습형 운영을 구분하는 핵심 기준은?", choices: ["AI 모델의 이름이 최신인지 여부", "생성된 보고서의 분량", "입력·판단·실행·결과 검증이 폐쇄 루프로 반복되는지 여부", "작업자를 완전히 제거했는지 여부"], answer: "입력·판단·실행·결과 검증이 폐쇄 루프로 반복되는지 여부", explanation: "AI의 가치는 한 번의 답변보다 입력, 판단, 실행, 검증이 반복되며 예측과 표준이 개선되는 데 있습니다." },
  { id: "day1-q5", subjectId: "diagnosis", subject: "현장 진단", label: "운영 준비", type: "multiple", question: "현장에 필요한 장비는 정해졌지만 운영 담당자, 데이터 출처, 교육계획과 예외 대응방식이 없다. 가장 적절한 컨설팅 판단은?", choices: ["장비가격이 낮으면 즉시 구매한다.", "구매를 서두르지 말고 즉시개선으로 운영조건과 책임체계부터 준비한다.", "공급기업에 모든 운영책임을 영구적으로 넘긴다.", "설치 후 문제가 발생하면 그때 KPI를 정한다."], answer: "구매를 서두르지 말고 즉시개선으로 운영조건과 책임체계부터 준비한다.", explanation: "담당자, 데이터, 교육, 예외대응이 없으면 장비가 정착하기 어렵습니다. 구매 전에 운영 준비도를 높여야 합니다." },
  { id: "day1-q6", subjectId: "diagnosis", subject: "현장 진단", label: "증거 확인", type: "multiple", question: "관찰 결과와 작업자 인터뷰, 시스템 기록의 내용이 서로 다를 때 적절한 처리방법은?", choices: ["세 값을 평균내어 하나의 값으로 확정한다.", "가장 오래 근무한 작업자의 말만 사용한다.", "시스템 기록만 항상 정확하다고 가정한다.", "차이가 발생한 기간·제품·물량·작업조건을 찾아 추가로 교차확인한다."], answer: "차이가 발생한 기간·제품·물량·작업조건을 찾아 추가로 교차확인한다.", explanation: "증거가 다르면 평균내지 말고 제품, 기간, 물량, 작업자와 같은 조건을 추가 확인해야 합니다." },
  { id: "day1-q7", subjectId: "diagnosis", subject: "현장 진단", label: "우선순위", type: "multiple", question: "과제 우선순위는 영향도 40%, 반복성 30%, 실행성 30%로 평가한다. 이와 별도로 적용해야 할 원칙은?", choices: ["안전·법규 위험은 일반 점수와 관계없이 즉시조치 여부를 검토한다.", "장비가격이 높은 과제를 자동으로 1순위로 정한다.", "반복성이 낮으면 안전위험도 보류한다.", "공급기업이 추천한 과제에 최고점을 준다."], answer: "안전·법규 위험은 일반 점수와 관계없이 즉시조치 여부를 검토한다.", explanation: "일반 과제는 점수로 비교하되 안전·법규 위험은 점수와 별도로 즉시조치를 검토합니다." },
  { id: "day1-q8", subjectId: "diagnosis", subject: "현장 진단", label: "요구사항", type: "multiple", question: "‘자동포장기 1대를 구매한다’는 요청을 실행 가능한 필요사항으로 바꾼 것으로 가장 적절한 것은?", choices: ["유명 브랜드와 장비 색상을 먼저 지정한다.", "보조금 한도에 맞춰 장비가격만 확정한다.", "자동계수·라벨검증·주문연동·오류이력 저장 기능과 사용자·데이터·설치·유지관리 조건을 명세한다.", "공급기업이 모든 데이터와 계정을 소유하도록 한다."], answer: "자동계수·라벨검증·주문연동·오류이력 저장 기능과 사용자·데이터·설치·유지관리 조건을 명세한다.", explanation: "필요사항은 장비명이 아니라 문제를 해결할 기능, 데이터, 사용자, 권한, 설치환경과 성과조건으로 표현해야 합니다." },
  { id: "day1-q9", subjectId: "performance", subject: "성과관리", label: "KPI 정의", type: "multiple", question: "KPI 정의서에 반드시 포함해야 할 내용의 조합으로 가장 적절한 것은?", choices: ["지표명과 목표값만 기록한다.", "지표 목적·산식·단위·범위·출처·주기·담당자·기준값·목표값·대응방법을 정한다.", "측정하기 쉬운 모든 수치를 KPI로 지정한다.", "담당자마다 서로 다른 계산식을 사용한다."], answer: "지표 목적·산식·단위·범위·출처·주기·담당자·기준값·목표값·대응방법을 정한다.", explanation: "KPI는 같은 데이터로 동일한 값을 계산하고 수치가 나빠졌을 때 다음 행동까지 정할 수 있어야 합니다." },
  { id: "day1-q10", subjectId: "performance", subject: "성과관리", label: "기준선", type: "multiple", question: "지원 전 기준선을 설정하는 방법으로 가장 적절한 것은?", choices: ["성과가 가장 좋았던 하루만 선택한다.", "공급기업의 예상효과를 기준선으로 사용한다.", "휴업과 대형고장을 포함하되 예외표시는 하지 않는다.", "대표 물량이 포함된 기간에 동일 제품·공정·근무조건을 측정하고 표본수와 예외를 함께 기록한다."], answer: "대표 물량이 포함된 기간에 동일 제품·공정·근무조건을 측정하고 표본수와 예외를 함께 기록한다.", explanation: "기준선은 지원 전 정상 상태를 대표해야 하며 동일 조건, 표본수, 편차와 예외 사유를 남겨야 합니다." },
  { id: "day1-q11", subjectId: "diagnosis", subject: "현장 진단", label: "서술형", type: "long", question: "현장 진단의 4단계를 순서대로 쓰고, 각 단계의 핵심 목적을 한 문장씩 설명하십시오.", answer: "범위 설정, 증거 수집, 문제 구조화, 지원 도출", acceptedAnswers: ["범위 설정 증거 수집 문제 구조화 지원 도출", "범위설정 증거수집 문제구조화 지원도출"], explanation: "범위 설정, 증거 수집, 문제 구조화, 지원 도출의 순서입니다. 대상과 공정을 정하고, 증거를 교차확인하고, 현상·원인·영향을 분리한 뒤 지원과 KPI를 정합니다." },
  { id: "day1-q12", subjectId: "performance", subject: "성과관리", label: "개선율 계산", type: "short", question: "평균 작업시간이 12분에서 8.4분으로 감소했습니다. 감소형 개선율을 계산하고 의미를 간단히 설명하십시오.", answer: "30%", acceptedAnswers: ["30", "30%", "30퍼센트"], explanation: "(12 - 8.4) ÷ 12 × 100 = 30%입니다. 실제 성과 판단 전 제품, 물량, 근무시간과 측정조건이 같은지 확인해야 합니다." },
  { id: "day1-q13", subjectId: "diagnosis", subject: "현장 진단", label: "사례 서술형", type: "long", question: "주문제작 가구업체의 납기 문제에 대해 진단 범위·증거, 현상·원인·영향, 지원 분야, 필요한 기능·데이터·사용자·실행조건, 단계별 개선과 KPI를 연결해 설명하십시오.", answer: "주문부터 출하까지 진단하고 관찰·인터뷰·기록을 교차확인한다. 구두변경과 기록부재를 원인으로 보고 공정시간·WIP·납기 KPI를 관리한다.", acceptedAnswers: ["주문부터 출하까지", "주문 접수부터 출하까지", "관찰 인터뷰 기록"], explanation: "주문부터 출하까지 추적하고 재공품, 대기, 긴급주문과 고장을 관찰합니다. 구두 전달과 기록 부재를 원인으로 구조화하고 즉시개선, 단기 검증, 중장기 확산과 WIP·리드타임·납기준수율을 설계합니다." },
  { id: "day1-q14", subjectId: "performance", subject: "성과관리", label: "개선율 검증", type: "long", question: "자동계수·라벨검증 적용 후 재출력 6건→1건, 평균 출하지연 25분→5분입니다. 두 감소형 개선율과 성과 인정에 필요한 비교조건·기능 사용·증거·외부요인을 설명하십시오.", answer: "83.3%, 80%", acceptedAnswers: ["83.3 80", "83.3% 80%", "약 83.3% 80%"], explanation: "재출력은 (6-1)÷6×100=약 83.3%, 지연은 (25-5)÷25×100=80%입니다. 기간·주문량·제품구성·근무조건과 계산식을 맞추고 기능 로그, 작업표, 인터뷰와 외부요인을 교차검증해야 합니다." },
];

export const problemSets: ProblemSet[] = [
  { id: "day1-morning", title: "1일차 오전 학습문제", subjectId: "dx", subject: "디지털 전환·현장 진단·성과관리", description: "1~3차시 · 개념 구분 · 현장 판단 · 성과검증", subtitle: "14문제 · 디지털 전환 · 성과검증", problemIds: problems.map((problem) => problem.id), accent: "#E8EDFF" },
  { id: "quick-core", title: "핵심 개념 4문제", subjectId: "dx", subject: "핵심 복습", description: "짧고 선명하게 기본 개념 점검", subtitle: "4문제 · 핵심 개념 점검", problemIds: problems.slice(0, 4).map((problem) => problem.id), accent: "#E6F8F2" },
];

export const examSets = problemSets;

export function normalizeAnswer(value: string) {
  return value.trim().replace(/[\s.,%％()（）→·]/g, "").toLowerCase();
}

export function gradeAnswers(answerMap: Record<string, string>, sourceProblems: Problem[] = problems): Attempt[] {
  return sourceProblems.map((problem) => {
    const answer = answerMap[problem.id] ?? "";
    const accepted = [problem.answer, ...(problem.acceptedAnswers ?? [])];
    return { problemId: problem.id, answer, isCorrect: accepted.some((candidate) => normalizeAnswer(answer) === normalizeAnswer(candidate)) };
  });
}
