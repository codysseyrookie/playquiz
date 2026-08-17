import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { haptic } from "@/lib/haptics";
import { useStudy } from "@/lib/study-provider";

export default function ResultScreen() {
  const router = useRouter();
  const { history, libraryProblems } = useStudy();
  const result = history[0];

  if (!result) {
    return <ScreenContainer className="items-center justify-center px-5"><Text style={styles.emptyTitle}>아직 채점 결과가 없어요.</Text><Pressable onPress={() => router.replace("/")} style={styles.emptyButton}><Text style={styles.emptyButtonText}>오늘으로 돌아가기</Text></Pressable></ScreenContainer>;
  }

  const sourceProblems = result.problemIds.map((id) => libraryProblems.find((problem) => problem.id === id)).filter((problem): problem is NonNullable<typeof problem> => Boolean(problem));
  const incorrect = result.attempts.filter((attempt) => !attempt.isCorrect).length;
  const percent = Math.round((result.score / Math.max(1, sourceProblems.length)) * 100);

  return (
    <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={sourceProblems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}><Pressable onPress={() => router.replace("/")} hitSlop={8} style={styles.close}><IconSymbol name="chevron.left" size={23} color="#1D2433" /></Pressable><Text style={styles.headerTitle}>채점 결과</Text><View style={styles.close} /></View>
            <View style={styles.scoreCard}>
              <View style={styles.scoreRing}><Text style={styles.scoreNumber}>{percent}</Text><Text style={styles.scoreUnit}>점</Text></View>
              <Text style={styles.scoreTitle}>{result.score === sourceProblems.length ? "완벽해요!" : "수고했어요!"}</Text>
              <Text style={styles.scoreBody}>{result.score}문제를 맞혔고, {incorrect}문제를 다시 보면 더 단단해질 거예요.</Text>
              <View style={styles.scoreStats}><View><Text style={styles.scoreStatValue}>{result.score}/{sourceProblems.length}</Text><Text style={styles.scoreStatLabel}>정답 수</Text></View><View style={styles.statDivider} /><View><Text style={styles.scoreStatValue}>{Math.max(1, Math.ceil(result.durationSeconds / 60))}분</Text><Text style={styles.scoreStatLabel}>풀이 시간</Text></View></View>
            </View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>문제별 결과</Text><Text style={styles.sectionMeta}>해설을 확인해보세요</Text></View>
          </>
        }
        renderItem={({ item, index }) => {
          const attempt = result.attempts.find((value) => value.problemId === item.id);
          const isCorrect = attempt?.isCorrect ?? false;
          return <Pressable onPress={() => { haptic.light(); router.push(`/review/${item.id}` as never); }} style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}><View style={[styles.resultIcon, { backgroundColor: isCorrect ? "#E2F5EF" : "#FDE9E7" }]}><IconSymbol name={isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"} size={20} color={isCorrect ? "#0F9F78" : "#E45A4E"} /></View><View style={styles.resultInfo}><Text style={styles.resultIndex}>문제 {index + 1} · {item.subject}</Text><Text style={styles.resultQuestion} numberOfLines={1}>{item.question}</Text></View><IconSymbol name="chevron.right" size={21} color="#8791A5" /></Pressable>;
        }}
        ListFooterComponent={<Pressable onPress={() => router.replace("/(tabs)/review" as never)} style={({ pressed }) => [styles.reviewButton, pressed && styles.pressed]}><Text style={styles.reviewButtonText}>오답 복습 시작하기</Text><IconSymbol name="arrow.right" size={19} color="#FFFFFF" /></Pressable>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 18 }, header: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, close: { width: 42, height: 42, justifyContent: "center", alignItems: "center" }, headerTitle: { color: "#1D2433", fontSize: 17, fontWeight: "800" },
  scoreCard: { borderRadius: 24, backgroundColor: "#E8EDFF", alignItems: "center", padding: 23, marginBottom: 27 }, scoreRing: { width: 108, height: 108, borderRadius: 54, borderWidth: 9, borderColor: "#3653E8", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, scoreNumber: { fontSize: 32, fontWeight: "900", lineHeight: 37, color: "#263877" }, scoreUnit: { color: "#697386", fontSize: 12, fontWeight: "800" }, scoreTitle: { color: "#263877", fontSize: 23, fontWeight: "800", marginTop: 15 }, scoreBody: { color: "#536078", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 6 }, scoreStats: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 25, marginTop: 19 }, scoreStatValue: { color: "#263877", fontSize: 16, textAlign: "center", fontWeight: "800" }, scoreStatLabel: { color: "#7B879C", fontSize: 11, marginTop: 3, fontWeight: "700" }, statDivider: { height: 30, width: 1, backgroundColor: "#C9D2FF" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }, sectionTitle: { color: "#1D2433", fontSize: 18, fontWeight: "800" }, sectionMeta: { color: "#8791A5", fontSize: 12, fontWeight: "600" }, resultRow: { minHeight: 70, borderBottomWidth: 1, borderBottomColor: "#E8ECF4", flexDirection: "row", alignItems: "center", paddingVertical: 10 }, resultIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 11 }, resultInfo: { flex: 1, marginRight: 6 }, resultIndex: { color: "#7B879C", fontSize: 11, fontWeight: "700", marginBottom: 3 }, resultQuestion: { color: "#101828", fontSize: 14, fontWeight: "800" }, reviewButton: { height: 54, borderRadius: 16, backgroundColor: "#3653E8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 24 }, reviewButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] }, emptyTitle: { color: "#1D2433", fontSize: 18, fontWeight: "800" }, emptyButton: { marginTop: 16, paddingHorizontal: 18, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#3653E8" }, emptyButtonText: { color: "#FFFFFF", fontWeight: "800" },
});
