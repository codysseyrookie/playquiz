import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { haptic } from "@/lib/haptics";
import { useStudy } from "@/lib/study-provider";

export default function HomeScreen() {
  const router = useRouter();
  const { beginExam, history, problemSets } = useStudy();
  const latest = history[0];
  const correct = latest?.score ?? 0;

  const startExam = (title: string, problemIds: string[]) => {
    haptic.light();
    beginExam(title, problemIds);
    router.push("/exam" as never);
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        style={styles.list}
        data={problemSets}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.kicker}>오늘도 차근차근</Text>
                <Text style={styles.title}>안녕하세요, 학습자님</Text>
              </View>
              <View style={styles.avatar}><Text style={styles.avatarText}>나</Text></View>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={styles.heroIcon}><IconSymbol name="clock.fill" size={19} color="#3653E8" /></View>
                <Text style={styles.heroTag}>오늘의 학습</Text>
              </View>
              <Text style={styles.heroTitle}>10분이면 충분해요.</Text>
              <Text style={styles.heroBody}>핵심 개념 4문제로 오늘의 감각을 깨워보세요.</Text>
              <Pressable onPress={() => problemSets[0] && startExam(problemSets[0].title, problemSets[0].problemIds)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>시험 시작하기</Text>
                <IconSymbol name="arrow.right" size={19} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>학습 현황</Text>
              <Text style={styles.sectionMeta}>{latest ? "최근 시험 기준" : "첫 시험을 시작해보세요"}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{history.length}</Text>
                <Text style={styles.statLabel}>응시한 시험</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{latest ? `${correct}/${latest.problemIds.length}` : "—"}</Text>
                <Text style={styles.statLabel}>최근 정답</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{latest ? `${Math.round((correct / Math.max(1, latest.problemIds.length)) * 100)}%` : "—"}</Text>
                <Text style={styles.statLabel}>최근 정답률</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>추천 테스트</Text>
              <Text style={styles.sectionMeta}>짧고 선명하게</Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <Pressable onPress={() => startExam(item.title, item.problemIds)} style={({ pressed }) => [styles.examCard, { backgroundColor: item.accent }, pressed && styles.pressed]}>
            <View style={styles.examIndex}><Text style={styles.examIndexText}>{String(index + 1).padStart(2, "0")}</Text></View>
            <View style={styles.examInfo}>
              <Text style={styles.examTitle}>{item.title}</Text>
              <Text style={styles.examSubtitle}>{item.subtitle}</Text>
            </View>
            <IconSymbol name="chevron.right" size={22} color="#536078" />
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 120, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  kicker: { color: "#697386", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  title: { color: "#1D2433", fontSize: 25, lineHeight: 32, fontWeight: "800", letterSpacing: -0.6 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#3653E8" },
  avatarText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  hero: { backgroundColor: "#E8EDFF", padding: 22, borderRadius: 24, marginBottom: 26 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 13 },
  heroIcon: { width: 32, height: 32, backgroundColor: "#FFFFFF", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroTag: { color: "#3653E8", fontSize: 13, fontWeight: "800" },
  heroTitle: { color: "#263877", fontSize: 25, fontWeight: "800", lineHeight: 32, letterSpacing: -0.5 },
  heroBody: { color: "#536078", fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 20 },
  primaryButton: { height: 52, paddingHorizontal: 18, borderRadius: 15, backgroundColor: "#3653E8", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, marginTop: 2 },
  sectionTitle: { color: "#1D2433", fontSize: 18, lineHeight: 24, fontWeight: "800" },
  sectionMeta: { color: "#8B95A7", fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 26 },
  statCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 15, paddingHorizontal: 10, borderWidth: 1, borderColor: "#E8ECF4" },
  statValue: { color: "#1D2433", fontSize: 20, fontWeight: "800", textAlign: "center" },
  statLabel: { color: "#7B879C", fontSize: 11, fontWeight: "600", textAlign: "center", marginTop: 5 },
  examCard: { padding: 17, borderRadius: 18, flexDirection: "row", alignItems: "center", marginBottom: 10 },
  examIndex: { width: 33, height: 33, borderRadius: 11, backgroundColor: "#FFFFFFAA", justifyContent: "center", alignItems: "center", marginRight: 12 },
  examIndexText: { color: "#536078", fontWeight: "800", fontSize: 12 },
  examInfo: { flex: 1 },
  examTitle: { color: "#1D2433", fontSize: 15, lineHeight: 21, fontWeight: "800" },
  examSubtitle: { color: "#667085", fontSize: 12, lineHeight: 18, marginTop: 2 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
