import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { haptic } from "@/lib/haptics";
import { useStudy } from "@/lib/study-provider";

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function ExamScreen() {
  const router = useRouter();
  const { activeExamTitle, activeProblemIds, libraryProblems, answers, setAnswer, submitExam } = useStudy();
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const examProblems = activeProblemIds.map((id) => libraryProblems.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const problem = examProblems[index];
  const answered = examProblems.filter((item) => answers[item.id]?.trim()).length;

  useEffect(() => {
    const timer = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = useMemo(() => `${index + 1} / ${examProblems.length}`, [index, examProblems.length]);

  const submit = () => {
    const unanswered = examProblems.length - answered;
    const complete = () => {
      haptic.success();
      submitExam(elapsed);
      router.replace("/result" as never);
    };
    if (unanswered > 0) {
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

        <View style={styles.problemMeta}>
          <Text style={styles.subject}>{problem.subject}</Text>
          <Text style={styles.label}>{problem.label}</Text>
        </View>
        <Text style={styles.question}>{problem.question}</Text>

        <View style={styles.answerArea}>
          {problem?.type === "multiple" ? (
            problem.choices?.map((choice, choiceIndex) => {
              const selected = answers[problem.id] === choice;
              return (
                <Pressable key={choice} onPress={() => { haptic.selection(); setAnswer(problem.id, choice); }} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
                  <View style={[styles.choiceMarker, selected && styles.choiceMarkerSelected]}><Text style={[styles.choiceMarkerText, selected && styles.choiceMarkerTextSelected]}>{String.fromCharCode(65 + choiceIndex)}</Text></View>
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice}</Text>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>답안을 입력하세요</Text>
              <TextInput value={answers[problem.id] ?? ""} onChangeText={(value) => setAnswer(problem.id, value)} placeholder="예: 대류" placeholderTextColor="#A3ACBD" autoCapitalize="none" returnKeyType="done" style={styles.input} />
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Pressable disabled={index === 0} onPress={() => setIndex((current) => Math.max(0, current - 1))} style={({ pressed }) => [styles.previousButton, index === 0 && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.previousText}>이전</Text>
          </Pressable>
          {index === examProblems.length - 1 ? (
            <Pressable onPress={submit} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
              <Text style={styles.submitText}>답안 제출하기</Text>
              <IconSymbol name="checkmark.circle.fill" size={19} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable onPress={() => { haptic.light(); setIndex((current) => current + 1); }} style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
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
  topbar: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E8F0", borderRadius: 14, backgroundColor: "#FFFFFF" },
  examMeta: { flex: 1 }, examName: { fontSize: 14, lineHeight: 19, color: "#1D2433", fontWeight: "800" }, timer: { fontSize: 12, lineHeight: 17, color: "#7B879C", fontWeight: "600", marginTop: 1 },
  questionCount: { paddingHorizontal: 11, paddingVertical: 8, backgroundColor: "#EEF1F8", borderRadius: 12 }, questionCountText: { color: "#536078", fontSize: 12, fontWeight: "800" },
  progressTrack: { height: 5, backgroundColor: "#E5E9F3", borderRadius: 4, marginTop: 21, overflow: "hidden" }, progressFill: { height: 5, backgroundColor: "#3653E8", borderRadius: 4 },
  problemMeta: { flexDirection: "row", gap: 8, marginTop: 34, alignItems: "center" }, subject: { color: "#3653E8", fontSize: 13, fontWeight: "800" }, label: { color: "#7B879C", fontSize: 13, fontWeight: "600" },
  question: { color: "#101828", fontSize: 23, lineHeight: 34, fontWeight: "900", letterSpacing: -0.4, marginTop: 12 },
  answerArea: { flex: 1, marginTop: 30 }, choice: { minHeight: 62, borderRadius: 16, borderWidth: 1, borderColor: "#E2E7F0", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 11 }, choiceSelected: { borderColor: "#3653E8", backgroundColor: "#E3E9FF" },
  choiceMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F0F2F7", alignItems: "center", justifyContent: "center", marginRight: 12 }, choiceMarkerSelected: { backgroundColor: "#3653E8" }, choiceMarkerText: { color: "#697386", fontSize: 12, fontWeight: "800" }, choiceMarkerTextSelected: { color: "#FFFFFF" }, choiceText: { color: "#101828", fontSize: 15, fontWeight: "800", flex: 1 }, choiceTextSelected: { color: "#172B85" },
  inputBox: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 17, borderWidth: 1, borderColor: "#E2E7F0" }, inputLabel: { fontSize: 13, color: "#697386", fontWeight: "700", marginBottom: 10 }, input: { minHeight: 50, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", color: "#101828", fontSize: 17, fontWeight: "800" },
  footer: { flexDirection: "row", gap: 11, paddingTop: 10 }, previousButton: { height: 54, width: 80, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF1F6" }, disabled: { opacity: 0.42 }, previousText: { color: "#536078", fontSize: 15, fontWeight: "800" }, nextButton: { height: 54, flex: 1, borderRadius: 16, backgroundColor: "#3653E8", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 }, nextText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, submitButton: { height: 54, flex: 1, borderRadius: 16, backgroundColor: "#0F9F78", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 }, submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
