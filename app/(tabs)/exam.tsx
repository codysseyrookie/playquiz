import { useEffect, useMemo, useRef } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { haptic } from "@/lib/haptics";
import { gradeAnswers } from "@/lib/study-data";
import { useStudy } from "@/lib/study-provider";

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function ExamScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { activeExamTitle, activeProblemIds, libraryProblems, answers, checkedProblemIds, activeAnswerCheckMode, activeQuestionIndex: index, elapsedSeconds: elapsed, setAnswer, checkAnswer, setActiveQuestionIndex, advanceExamTime, submitExam } = useStudy();
  const examProblems = activeProblemIds.map((id) => libraryProblems.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const problem = examProblems[index];
  const isQuestionMode = activeAnswerCheckMode === "question";
  const checked = Boolean(isQuestionMode && problem && checkedProblemIds.includes(problem.id));
  const hasAnswer = Boolean(problem && answers[problem.id]?.trim());
  const answered = examProblems.filter((item) => answers[item.id]?.trim()).length;
  const isCorrect = Boolean(problem && checked && gradeAnswers(answers, [problem])[0]?.isCorrect);
  const isDenseChoiceLayout = Boolean(problem?.type === "multiple" && (problem.choices?.length ?? 0) >= 5);

  useEffect(() => {
    const timer = setInterval(advanceExamTime, 1000);
    return () => clearInterval(timer);
  }, [advanceExamTime]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  const progress = useMemo(() => `${index + 1} / ${examProblems.length}`, [index, examProblems.length]);

  const revealAnswer = () => {
    if (!problem || !hasAnswer) return;
    const correct = gradeAnswers(answers, [problem])[0]?.isCorrect ?? false;
    if (correct) haptic.success();
    else haptic.error();
    checkAnswer(problem.id);
  };

  const submit = () => {
    const complete = () => {
      haptic.success();
      submitExam(elapsed);
      router.replace("/result" as never);
    };
    const unanswered = examProblems.length - answered;
    if (!isQuestionMode && unanswered > 0) {
      Alert.alert("답하지 않은 문제가 있어요", `${unanswered}문제를 비워둔 채 제출할까요?`, [
        { text: "계속 풀기", style: "cancel" },
        { text: "제출하기", style: "destructive", onPress: complete },
      ]);
      return;
    }
    complete();
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}>
      <View style={styles.root}>
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <IconSymbol name="chevron.left" size={23} color="#1D2433" />
          </Pressable>
          <View style={styles.examMeta}>
            <Text style={styles.examName} numberOfLines={1}>{activeExamTitle}</Text>
            <Text style={styles.timer}>{formatSeconds(elapsed)}</Text>
          </View>
          <View style={styles.questionCount}><Text style={styles.questionCountText}>{progress}</Text></View>
        </View>

        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((index + 1) / Math.max(1, examProblems.length)) * 100}%` }]} /></View>

        <ScrollView ref={scrollRef} style={styles.problemScroll} contentContainerStyle={styles.problemScrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.problemMeta, isDenseChoiceLayout && styles.problemMetaDense]}>
            <Text style={styles.subject}>{problem.subject}</Text>
            <Text style={styles.label}>{problem.label}</Text>
          </View>
          <Text style={[styles.question, isDenseChoiceLayout && styles.questionDense]}>{problem.question}</Text>

          <View style={[styles.answerArea, isDenseChoiceLayout && styles.answerAreaDense]}>
          {problem?.type === "multiple" ? (
            problem.choices?.map((choice, choiceIndex) => {
              const selected = answers[problem.id] === choice;
              const correctChoice = checked && choice === problem.answer;
              const wrongChoice = checked && selected && choice !== problem.answer;
              return (
                <Pressable key={choice} disabled={checked} onPress={() => { haptic.selection(); setAnswer(problem.id, choice); }} style={({ pressed }) => [styles.choice, isDenseChoiceLayout && styles.choiceDense, selected && styles.choiceSelected, correctChoice && styles.choiceCorrect, wrongChoice && styles.choiceWrong, pressed && !checked && styles.pressed]}>
                  <View style={[styles.choiceMarker, isDenseChoiceLayout && styles.choiceMarkerDense, selected && styles.choiceMarkerSelected, correctChoice && styles.choiceMarkerCorrect, wrongChoice && styles.choiceMarkerWrong]}><Text style={[styles.choiceMarkerText, selected && styles.choiceMarkerTextSelected]}>{String.fromCharCode(65 + choiceIndex)}</Text></View>
                  <Text style={[styles.choiceText, isDenseChoiceLayout && styles.choiceTextDense, selected && styles.choiceTextSelected, correctChoice && styles.choiceTextCorrect, wrongChoice && styles.choiceTextWrong]}>{choice}</Text>
                  {correctChoice ? <IconSymbol name="checkmark.circle.fill" size={isDenseChoiceLayout ? 18 : 20} color="#0F9F78" /> : wrongChoice ? <IconSymbol name="xmark.circle.fill" size={isDenseChoiceLayout ? 18 : 20} color="#E45A4E" /> : null}
                </Pressable>
              );
            })
          ) : (
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>답안을 입력하세요</Text>
              <TextInput value={answers[problem.id] ?? ""} editable={!checked} onChangeText={(value) => setAnswer(problem.id, value)} placeholder="예: 대류" placeholderTextColor="#A3ACBD" autoCapitalize="none" returnKeyType="done" style={[styles.input, checked && styles.inputChecked]} />
            </View>
          )}
          </View>
          {checked ? <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}><IconSymbol name={isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"} size={23} color={isCorrect ? "#0F9F78" : "#E45A4E"} /><View style={styles.feedbackText}><Text style={[styles.feedbackTitle, { color: isCorrect ? "#087A5B" : "#AD4138" }]}>{isCorrect ? "정답이에요. 잘 기억했어요!" : `정답은 ${problem.answer}이에요.`}</Text><Text style={styles.explanation}>{problem.explanation}</Text></View></View> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable disabled={index === 0} onPress={() => setActiveQuestionIndex(index - 1)} style={({ pressed }) => [styles.previousButton, index === 0 && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.previousText}>이전</Text>
          </Pressable>
          {!isQuestionMode ? (
            index === examProblems.length - 1 ? (
              <Pressable onPress={submit} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
                <Text style={styles.submitText}>답안 제출하기</Text>
                <IconSymbol name="checkmark.circle.fill" size={19} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable onPress={() => { haptic.light(); setActiveQuestionIndex(index + 1); }} style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
                <Text style={styles.nextText}>다음 문제</Text>
                <IconSymbol name="arrow.right" size={19} color="#FFFFFF" />
              </Pressable>
            )
          ) : !checked ? (
            <Pressable disabled={!hasAnswer} onPress={revealAnswer} style={({ pressed }) => [styles.checkButton, !hasAnswer && styles.disabled, pressed && hasAnswer && styles.pressed]}>
              <Text style={styles.checkText}>정답 확인하기</Text>
              <IconSymbol name="checkmark.circle.fill" size={19} color="#FFFFFF" />
            </Pressable>
          ) : index === examProblems.length - 1 ? (
            <Pressable onPress={submit} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
              <Text style={styles.submitText}>전체 결과 확인하기</Text>
              <IconSymbol name="checkmark.circle.fill" size={19} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable onPress={() => { haptic.light(); setActiveQuestionIndex(index + 1); }} style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
              <Text style={styles.nextText}>다음 문제</Text>
              <IconSymbol name="arrow.right" size={19} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 4 },
  problemScroll: { flex: 1, marginTop: 0 },
  problemScrollContent: { paddingBottom: 24 },
  topbar: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E8F0", borderRadius: 14, backgroundColor: "#FFFFFF" },
  examMeta: { flex: 1 }, examName: { fontSize: 14, lineHeight: 19, color: "#1D2433", fontWeight: "800" }, timer: { fontSize: 12, lineHeight: 17, color: "#7B879C", fontWeight: "600", marginTop: 1 },
  questionCount: { minWidth: 64, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#EEF1F8", borderRadius: 12, alignItems: "center" }, questionCountText: { color: "#3F4C63", fontSize: 17, lineHeight: 21, fontWeight: "900" },
  progressTrack: { height: 5, backgroundColor: "#E5E9F3", borderRadius: 4, marginTop: 21, overflow: "hidden" }, progressFill: { height: 5, backgroundColor: "#3653E8", borderRadius: 4 },
  problemMeta: { flexDirection: "row", gap: 8, marginTop: 34, alignItems: "center" }, problemMetaDense: { marginTop: 20 }, subject: { color: "#3653E8", fontSize: 13, fontWeight: "800" }, label: { color: "#7B879C", fontSize: 13, fontWeight: "600" },
  question: { color: "#101828", fontSize: 23, lineHeight: 34, fontWeight: "900", letterSpacing: -0.4, marginTop: 12 }, questionDense: { fontSize: 20, lineHeight: 29, marginTop: 8 },
  answerArea: { marginTop: 30 }, answerAreaDense: { marginTop: 18 }, choice: { minHeight: 68, borderRadius: 16, borderWidth: 1, borderColor: "#E2E7F0", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 11 }, choiceDense: { minHeight: 52, borderRadius: 14, paddingHorizontal: 12, marginBottom: 7 }, choiceSelected: { borderColor: "#3653E8", backgroundColor: "#E3E9FF" },
  choiceCorrect: { borderColor: "#0F9F78", backgroundColor: "#EAF8F3" }, choiceWrong: { borderColor: "#E45A4E", backgroundColor: "#FDEDEA" },
  choiceMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F0F2F7", alignItems: "center", justifyContent: "center", marginRight: 12 }, choiceMarkerDense: { width: 24, height: 24, borderRadius: 12, marginRight: 10 }, choiceMarkerSelected: { backgroundColor: "#3653E8" }, choiceMarkerCorrect: { backgroundColor: "#0F9F78" }, choiceMarkerWrong: { backgroundColor: "#E45A4E" }, choiceMarkerText: { color: "#697386", fontSize: 12, fontWeight: "800" }, choiceMarkerTextSelected: { color: "#FFFFFF" }, choiceText: { color: "#101828", fontSize: 17, lineHeight: 24, fontWeight: "800", flex: 1 }, choiceTextDense: { fontSize: 15, lineHeight: 20 }, choiceTextSelected: { color: "#172B85" }, choiceTextCorrect: { color: "#087A5B" }, choiceTextWrong: { color: "#AD4138" },
  inputBox: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 17, borderWidth: 1, borderColor: "#E2E7F0" }, inputLabel: { fontSize: 13, color: "#697386", fontWeight: "700", marginBottom: 10 }, input: { minHeight: 50, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", color: "#101828", fontSize: 17, fontWeight: "800" }, inputChecked: { backgroundColor: "#F7F8FC", color: "#536078" },
  feedback: { flexDirection: "row", gap: 10, padding: 16, borderRadius: 16, marginTop: 14 }, feedbackCorrect: { backgroundColor: "#EAF8F3" }, feedbackWrong: { backgroundColor: "#FDEDEA" }, feedbackText: { flex: 1 }, feedbackTitle: { fontSize: 14, fontWeight: "800" }, explanation: { color: "#3F4C63", fontSize: 16, lineHeight: 25, fontWeight: "600", marginTop: 8 },
  footer: { flexDirection: "row", gap: 11, paddingTop: 10, paddingBottom: 8 }, previousButton: { height: 54, width: 80, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF1F6" }, disabled: { opacity: 0.42 }, previousText: { color: "#536078", fontSize: 15, fontWeight: "800" }, checkButton: { height: 54, flex: 1, borderRadius: 16, backgroundColor: "#3653E8", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 }, checkText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, nextButton: { height: 54, flex: 1, borderRadius: 16, backgroundColor: "#3653E8", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 }, nextText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, submitButton: { height: 54, flex: 1, borderRadius: 16, backgroundColor: "#0F9F78", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 }, submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
