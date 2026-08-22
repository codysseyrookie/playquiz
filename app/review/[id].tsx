import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { haptic } from "@/lib/haptics";
import { normalizeAnswer } from "@/lib/study-data";
import { useStudy } from "@/lib/study-provider";

export default function ReviewProblemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProblemAttempt, libraryProblems } = useStudy();
  const problem = libraryProblems.find((item) => item.id === id);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  if (!problem) return <ScreenContainer className="items-center justify-center"><Text>문제를 찾을 수 없어요.</Text></ScreenContainer>;
  const previous = getProblemAttempt(problem.id);
  const isCorrect = [problem.answer, ...(problem.acceptedAnswers ?? [])].some((candidate) => normalizeAnswer(answer) === normalizeAnswer(candidate));

  const check = () => {
    setChecked(true);
    if (isCorrect) haptic.success();
    else haptic.error();
  };
  return <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}><View style={styles.root}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><IconSymbol name="chevron.left" size={23} color="#1D2433" /></Pressable><Text style={styles.headerTitle}>오답 복습</Text><View style={styles.back} /></View><View style={styles.tag}><Text style={styles.tagText}>{problem.subject} · {problem.label}</Text></View><Text style={styles.question}>{problem.question}</Text><Text style={styles.previous}>이전 답안: {previous?.answer || "미응답"}</Text><View style={styles.answerArea}>{problem.type === "multiple" ? problem.choices?.map((choice, index) => <Pressable key={choice} disabled={checked} onPress={() => { haptic.selection(); setAnswer(choice); }} style={({ pressed }) => [styles.choice, answer === choice && styles.choiceSelected, checked && choice === problem.answer && styles.correctChoice, checked && answer === choice && !isCorrect && styles.wrongChoice, pressed && styles.pressed]}><Text style={styles.choiceIndex}>{String.fromCharCode(65 + index)}</Text><Text style={styles.choiceText}>{choice}</Text>{checked && choice === problem.answer ? <IconSymbol name="checkmark.circle.fill" size={20} color="#0F9F78" /> : null}</Pressable>) : <TextInput value={answer} editable={!checked} onChangeText={setAnswer} placeholder="답안을 입력하세요" placeholderTextColor="#A3ACBD" style={styles.input} returnKeyType="done" />}</View>{checked ? <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}><IconSymbol name={isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"} size={23} color={isCorrect ? "#0F9F78" : "#E45A4E"} /><View style={styles.feedbackText}><Text style={[styles.feedbackTitle, { color: isCorrect ? "#087A5B" : "#AD4138" }]}>{isCorrect ? "정답이에요. 잘 기억했어요!" : `정답은 ${problem.answer}이에요.`}</Text><Text style={styles.explanation}>{problem.explanation}</Text></View></View> : null}<View style={styles.spacer} />{checked ? <Pressable onPress={() => router.replace("/(tabs)/review" as never)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>복습 목록으로</Text><IconSymbol name="arrow.right" size={19} color="#FFFFFF" /></Pressable> : <Pressable disabled={!answer.trim()} onPress={check} style={({ pressed }) => [styles.primary, !answer.trim() && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>정답 확인하기</Text><IconSymbol name="checkmark.circle.fill" size={19} color="#FFFFFF" /></Pressable>}</View></ScreenContainer>;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 4 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 44 }, back: { width: 42, height: 42, alignItems: "center", justifyContent: "center" }, headerTitle: { color: "#1D2433", fontSize: 16, fontWeight: "800" }, tag: { alignSelf: "flex-start", marginTop: 26, backgroundColor: "#FFF1EE", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 }, tagText: { color: "#C34B41", fontSize: 12, fontWeight: "800" }, question: { marginTop: 13, color: "#101828", fontSize: 22, lineHeight: 33, fontWeight: "900", letterSpacing: -0.4 }, previous: { marginTop: 11, color: "#7B879C", fontSize: 12, fontWeight: "700" }, answerArea: { marginTop: 25 }, choice: { minHeight: 58, paddingHorizontal: 15, borderWidth: 1, borderColor: "#E2E7F0", borderRadius: 16, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", marginBottom: 10 }, choiceSelected: { borderColor: "#3653E8", backgroundColor: "#E3E9FF" }, correctChoice: { borderColor: "#0F9F78", backgroundColor: "#EAF8F3" }, wrongChoice: { borderColor: "#E45A4E", backgroundColor: "#FDEDEA" }, choiceIndex: { color: "#7B879C", fontSize: 13, fontWeight: "800", width: 25 }, choiceText: { color: "#101828", fontSize: 15, fontWeight: "800", flex: 1 }, input: { minHeight: 54, paddingHorizontal: 15, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 15, color: "#101828", fontSize: 16, fontWeight: "800", backgroundColor: "#FFFFFF" }, feedback: { flexDirection: "row", gap: 10, padding: 16, borderRadius: 16, marginTop: 14 }, feedbackCorrect: { backgroundColor: "#EAF8F3" }, feedbackWrong: { backgroundColor: "#FDEDEA" }, feedbackText: { flex: 1 }, feedbackTitle: { fontSize: 14, fontWeight: "800" }, explanation: { color: "#3F4C63", fontSize: 16, lineHeight: 25, fontWeight: "600", marginTop: 8 }, spacer: { flex: 1 }, primary: { height: 54, borderRadius: 16, backgroundColor: "#3653E8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, disabled: { opacity: 0.42 }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
