import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { haptic } from "@/lib/haptics";
import { ProblemType } from "@/lib/study-data";
import { useStudy } from "@/lib/study-provider";
import { parseMarkdownProblemSet } from "@/lib/markdown-import";

export default function ManageScreen() {
  const router = useRouter();
  const { isReady, storageStatus, subjects, problemSets, libraryProblems, addSubject, addProblemSet, addProblem, deleteProblemSet, deleteProblem, beginExam, importProblemSet } = useStudy();
  const [subjectName, setSubjectName] = useState("");
  const [setTitle, setSetTitle] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id ?? "");
  const [selectedSetId, setSelectedSetId] = useState(problemSets[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [type, setType] = useState<ProblemType>("multiple");
  const [choices, setChoices] = useState("");
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [pendingDeleteSet, setPendingDeleteSet] = useState<{ id: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "neutral" | "error" } | null>(null);
  const [setSearchQuery, setSetSearchQuery] = useState("");
  const [setSortMode, setSetSortMode] = useState<"latest" | "name">("latest");

  const sortedProblemSets = useMemo(() => {
    const query = setSearchQuery.trim().toLocaleLowerCase();
    return [...problemSets]
      .filter((set) => !query || `${set.title} ${set.subject} ${set.description}`.toLocaleLowerCase().includes(query))
      .sort((a, b) => setSortMode === "name" ? a.title.localeCompare(b.title, "ko") : b.id.localeCompare(a.id));
  }, [problemSets, setSearchQuery, setSortMode]);
  const selectedSet = problemSets.find((set) => set.id === selectedSetId) ?? problemSets[0];
  const selectedSetProblems = useMemo(() => libraryProblems.filter((problem) => selectedSet?.problemIds.includes(problem.id)), [libraryProblems, selectedSet]);

  const importMarkdown = async () => {
    setIsImporting(true);
    setImportMessage("");
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/markdown", "text/plain"], copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.[0]) { showToast("문제 세트 업로드를 취소했어요.", "neutral"); return; }
      const asset = result.assets[0];
      const browserFile = (asset as DocumentPicker.DocumentPickerAsset & { file?: File }).file;
      const markdown = browserFile?.text ? await browserFile.text() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = parseMarkdownProblemSet(markdown, asset.name);
      const imported = importProblemSet(parsed);
      if (!imported) { Alert.alert("가져올 문제를 찾지 못했어요", "문항 제목과 정답·해설이 있는 Markdown인지 확인해 주세요."); showToast("문제 세트를 추가하지 못했어요. 파일 형식을 확인해 주세요.", "error"); return; }
      haptic.success();
      setSelectedSetId(imported.set.id);
      setImportMessage(`‘${imported.set.title}’ · ${imported.problemCount}문항을 가져왔어요.`);
      showToast(`문제 세트를 추가했어요. ${imported.problemCount}문항이 등록되었습니다.`, "success");
    } catch {
      haptic.error();
      Alert.alert("파일을 읽을 수 없어요", "Markdown 파일을 다시 선택해 주세요.");
      showToast("파일을 읽지 못했어요. 다시 시도해 주세요.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const createSubject = () => {
    const created = addSubject(subjectName);
    if (!created) { Alert.alert("과목을 추가할 수 없어요", "이름을 입력했는지 또는 같은 과목이 이미 있는지 확인해 주세요."); return; }
    haptic.success(); setSubjectName(""); setSelectedSubjectId(created.id);
  };

  const createSet = () => {
    const created = addProblemSet(setTitle, selectedSubjectId, setDescription);
    if (!created) { Alert.alert("문제 세트를 추가할 수 없어요", "세트 이름과 과목을 확인해 주세요."); return; }
    haptic.success(); setSetTitle(""); setSetDescription(""); setSelectedSetId(created.id);
  };

  const createProblem = () => {
    if (!selectedSet) { Alert.alert("먼저 문제 세트를 선택해 주세요"); return; }
    const created = addProblem({ problemSetId: selectedSet.id, subjectId: selectedSet.subjectId, label: type === "multiple" ? "객관식" : type === "short" ? "단답형" : "서술형", type, question, choices: type === "multiple" ? choices.split(",").map((item) => item.trim()).filter(Boolean) : undefined, answer, acceptedAnswers: type === "long" ? answer.split(",").map((item) => item.trim()).filter(Boolean) : undefined, explanation });
    if (!created) { Alert.alert("문항을 추가할 수 없어요", "문제와 정답을 입력해 주세요."); return; }
    haptic.success(); setQuestion(""); setChoices(""); setAnswer(""); setExplanation("");
  };

  const showToast = (message: string, tone: "success" | "neutral" | "error") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2400);
  };
  const confirmDeleteSet = (setId: string, title: string) => setPendingDeleteSet({ id: setId, title });
  const cancelDeleteSet = () => {
    setPendingDeleteSet(null);
    showToast("문제 세트 삭제를 취소했어요.", "neutral");
  };
  const handleDeleteSet = () => {
    if (!pendingDeleteSet) return;
    const deletedTitle = pendingDeleteSet.title;
    deleteProblemSet(pendingDeleteSet.id);
    setPendingDeleteSet(null);
    showToast(`‘${deletedTitle}’ 문제 세트를 삭제했어요.`, "success");
    haptic.light();
  };
  const confirmDeleteProblem = (problemId: string, questionText: string) => Alert.alert("문제를 삭제할까요?", `‘${questionText.slice(0, 36)}${questionText.length > 36 ? "…" : ""}’ 문항을 삭제합니다.`, [{ text: "취소", style: "cancel" }, { text: "삭제", style: "destructive", onPress: () => { deleteProblem(problemId); haptic.light(); } }]);

  return <ScreenContainer className="px-5"><ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={styles.kicker}>콘텐츠 스튜디오</Text><Text style={styles.title}>문제 관리</Text></View><View style={styles.headerIcon}><IconSymbol name="book.closed.fill" size={23} color="#3653E8" /></View></View>
    <Text style={styles.subtitle}>내 과목과 문제 세트를 만들고, 바로 시험으로 연결하세요.</Text>
    {storageStatus === "loading" && <View style={styles.storageNotice}><Text style={styles.storageNoticeText}>저장된 문제를 불러오는 중이에요…</Text></View>}
    {storageStatus === "error" && <View style={[styles.storageNotice, styles.storageNoticeError]}><Text style={styles.storageNoticeErrorText}>이 브라우저의 로컬 저장소에 접근할 수 없어요. 파일을 직접 열었다면 HTTP 서버로 실행해 주세요.</Text></View>}
    {!isReady && storageStatus !== "loading" && <View style={styles.storageNotice}><Text style={styles.storageNoticeText}>저장 준비가 되지 않아 입력을 잠시 기다려 주세요.</Text></View>}

    <View style={styles.importCard}><View style={styles.importTop}><View style={styles.importIcon}><IconSymbol name="book.closed.fill" size={20} color="#3653E8" /></View><View style={styles.importCopy}><Text style={styles.importTitle}>Markdown으로 한 번에 가져오기</Text><Text style={styles.importBody}>문제·선택지·정답·해설을 자동으로 읽어 문제 세트를 만들어요.</Text></View></View><Pressable disabled={isImporting} onPress={importMarkdown} style={({ pressed }) => [styles.importButton, pressed && styles.pressed, isImporting && styles.disabled]}><Text style={styles.importButtonText}>{isImporting ? "파일 읽는 중…" : "Markdown 파일 선택"}</Text><IconSymbol name="arrow.right" size={18} color="#3653E8" /></Pressable>{importMessage ? <Text style={styles.importSuccess}>{importMessage}</Text> : <Text style={styles.importHint}>권장 형식: .md · 14문항 학습문제 형식을 지원합니다.</Text>}</View>

    <Text style={styles.sectionTitle}>과목</Text>
    <View style={styles.inlineForm}><TextInput value={subjectName} onChangeText={setSubjectName} placeholder="새 과목 이름" placeholderTextColor="#A3ACBD" style={styles.inlineInput} returnKeyType="done"/><Pressable onPress={createSubject} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}><Text style={styles.smallButtonText}>추가</Text></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{subjects.map((subject) => <Pressable key={subject.id} onPress={() => setSelectedSubjectId(subject.id)} style={[styles.chip, selectedSubjectId === subject.id && { backgroundColor: subject.color }]}><Text style={[styles.chipText, selectedSubjectId === subject.id && styles.selectedChipText]}>{subject.name}</Text></Pressable>)}</ScrollView>

    <Text style={styles.sectionTitle}>문제 세트 만들기</Text>
    <View style={styles.formCard}><TextInput value={setTitle} onChangeText={setSetTitle} placeholder="문제 세트 이름" placeholderTextColor="#A3ACBD" style={styles.input}/><TextInput value={setDescription} onChangeText={setSetDescription} placeholder="설명 (선택)" placeholderTextColor="#A3ACBD" style={styles.input}/><Text style={styles.formHint}>선택된 과목: {subjects.find((subject) => subject.id === selectedSubjectId)?.name ?? "없음"}</Text><Pressable onPress={createSet} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><IconSymbol name="plus.circle.fill" size={19} color="#FFFFFF"/><Text style={styles.primaryText}>문제 세트 추가</Text></Pressable></View>

    <View style={styles.setHeader}><Text style={styles.sectionTitle}>내 문제 세트 <Text style={styles.count}>({problemSets.length})</Text></Text><Text style={styles.resultCount}>{sortedProblemSets.length}개 표시</Text></View>
    <View style={styles.searchRow}><IconSymbol name="magnifyingglass" size={18} color="#8A94A8" /><TextInput value={setSearchQuery} onChangeText={setSetSearchQuery} placeholder="세트 이름, 과목, 설명 검색" placeholderTextColor="#A3ACBD" style={styles.searchInput} returnKeyType="search" />{setSearchQuery ? <Pressable onPress={() => setSetSearchQuery("")} hitSlop={8}><IconSymbol name="xmark.circle.fill" size={17} color="#A3ACBD" /></Pressable> : null}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}><Pressable onPress={() => setSetSortMode("latest")} style={[styles.sortChip, setSortMode === "latest" && styles.sortChipActive]}><Text style={[styles.sortChipText, setSortMode === "latest" && styles.sortChipTextActive]}>최신순</Text></Pressable><Pressable onPress={() => setSetSortMode("name")} style={[styles.sortChip, setSortMode === "name" && styles.sortChipActive]}><Text style={[styles.sortChipText, setSortMode === "name" && styles.sortChipTextActive]}>이름순</Text></Pressable></ScrollView>
    {sortedProblemSets.map((set) => <Pressable key={set.id} onPress={() => setSelectedSetId(set.id)} style={[styles.setCard, selectedSet?.id === set.id && styles.setCardSelected]}><View style={[styles.setBadge, { backgroundColor: set.accent }]}><Text style={styles.setBadgeText}>{set.problemIds.length}</Text></View><View style={styles.setInfo}><Text style={styles.setTitle}>{set.title}</Text><Text style={styles.setSubtitle}>{set.subject} · {set.description}</Text></View><Pressable hitSlop={8} onPress={() => confirmDeleteSet(set.id, set.title)}><IconSymbol name="trash.fill" size={20} color="#9AA3B5"/></Pressable></Pressable>)}

    {sortedProblemSets.length === 0 && <View style={styles.emptyState}><IconSymbol name="magnifyingglass" size={22} color="#9AA3B5" /><Text style={styles.emptyTitle}>검색 결과가 없어요</Text><Text style={styles.emptyBody}>다른 이름이나 과목으로 다시 검색해 보세요.</Text></View>}

    <Text style={styles.sectionTitle}>문항 추가 <Text style={styles.count}>({selectedSet?.title ?? "세트 선택"})</Text></Text>
    <View style={styles.formCard}><TextInput value={question} onChangeText={setQuestion} multiline placeholder="문제 내용을 입력하세요" placeholderTextColor="#A3ACBD" style={[styles.input, styles.questionInput]}/><View style={styles.typeRow}>{(["multiple", "short", "long"] as ProblemType[]).map((item) => <Pressable key={item} onPress={() => setType(item)} style={[styles.typeButton, type === item && styles.typeButtonActive]}><Text style={[styles.typeText, type === item && styles.typeTextActive]}>{item === "multiple" ? "객관식" : item === "short" ? "단답형" : "서술형"}</Text></Pressable>)}</View>{type === "multiple" && <TextInput value={choices} onChangeText={setChoices} placeholder="선택지 (쉼표로 구분)" placeholderTextColor="#A3ACBD" style={styles.input}/>}<TextInput value={answer} onChangeText={setAnswer} placeholder={type === "long" ? "채점 기준 키워드 (쉼표로 구분)" : "정답"} placeholderTextColor="#A3ACBD" style={styles.input}/><TextInput value={explanation} onChangeText={setExplanation} multiline placeholder="정답 해설" placeholderTextColor="#A3ACBD" style={[styles.input, styles.explanationInput]}/><Pressable onPress={createProblem} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><IconSymbol name="checkmark.circle.fill" size={19} color="#FFFFFF"/><Text style={styles.primaryText}>문항 저장</Text></Pressable></View>

    <Text style={styles.sectionTitle}>선택한 세트의 문항 <Text style={styles.count}>({selectedSetProblems.length})</Text></Text>
    {selectedSetProblems.map((problem, index) => <View key={problem.id} style={styles.problemRow}><View style={styles.problemNumber}><Text style={styles.problemNumberText}>{index + 1}</Text></View><View style={styles.problemInfo}><Text style={styles.problemLabel}>{problem.label}</Text><Text style={styles.problemText} numberOfLines={2}>{problem.question}</Text></View><Pressable hitSlop={8} onPress={() => confirmDeleteProblem(problem.id, problem.question)}><IconSymbol name="trash.fill" size={19} color="#A1A9B8"/></Pressable></View>)}

    {selectedSet && selectedSet.problemIds.length > 0 && <Pressable onPress={() => { haptic.light(); beginExam(selectedSet.title, selectedSet.problemIds); router.push("/exam" as never); }} style={({ pressed }) => [styles.examButton, pressed && styles.pressed]}><IconSymbol name="play.fill" size={18} color="#FFFFFF"/><Text style={styles.primaryText}>이 세트 바로 응시하기</Text></Pressable>}
  </ScrollView><Modal visible={Boolean(pendingDeleteSet)} transparent animationType="fade" onRequestClose={cancelDeleteSet}><View style={styles.modalOverlay}><View style={styles.modalCard}><View style={styles.modalIcon}><IconSymbol name="trash.fill" size={22} color="#E45A4E" /></View><Text style={styles.modalTitle}>문제 세트를 삭제할까요?</Text><Text style={styles.modalBody}>‘{pendingDeleteSet?.title ?? ""}’ 세트를 삭제합니다. 세트에 포함된 문항은 문제 보관함에 남습니다.</Text><View style={styles.modalActions}><Pressable onPress={cancelDeleteSet} style={({ pressed }) => [styles.modalCancel, pressed && styles.pressed]}><Text style={styles.modalCancelText}>취소</Text></Pressable><Pressable onPress={handleDeleteSet} style={({ pressed }) => [styles.modalDelete, pressed && styles.pressed]}><Text style={styles.modalDeleteText}>삭제하기</Text></Pressable></View></View></View></Modal>{toast && <View style={[styles.toast, toast.tone === "success" ? styles.toastSuccess : toast.tone === "error" ? styles.toastError : styles.toastNeutral]}><IconSymbol name={toast.tone === "success" ? "checkmark.circle.fill" : toast.tone === "error" ? "xmark.circle.fill" : "info.circle.fill"} size={18} color={toast.tone === "success" ? "#0F8061" : toast.tone === "error" ? "#C94B42" : "#3653E8"} /><Text style={styles.toastText}>{toast.message}</Text></View>}</ScreenContainer>;
}

const styles = StyleSheet.create({ storageNotice: { marginTop: 12, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, backgroundColor: "#EEF1F8" }, storageNoticeError: { backgroundColor: "#FFF0EE" }, storageNoticeText: { color: "#536078", fontSize: 12, lineHeight: 17, fontWeight: "700" }, storageNoticeErrorText: { color: "#A33D35", fontSize: 12, lineHeight: 17, fontWeight: "700" }, scroll: { flex: 1 }, content: { paddingTop: 16, paddingBottom: 140 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, importCard: { padding: 15, borderRadius: 18, backgroundColor: "#F0F3FF", borderWidth: 1, borderColor: "#DCE3FF", marginTop: 2 }, importTop: { flexDirection: "row", alignItems: "center" }, importIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 10 }, importCopy: { flex: 1 }, importTitle: { color: "#263877", fontSize: 14, fontWeight: "800" }, importBody: { color: "#68759A", fontSize: 11, lineHeight: 16, marginTop: 3 }, importButton: { height: 44, borderRadius: 12, backgroundColor: "#FFFFFF", marginTop: 13, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, importButtonText: { color: "#3653E8", fontSize: 13, fontWeight: "800" }, importHint: { color: "#7B879C", fontSize: 11, marginTop: 9 }, importSuccess: { color: "#0F8061", fontSize: 12, fontWeight: "800", marginTop: 9 }, disabled: { opacity: 0.45 }, toast: { position: "absolute", left: 18, right: 18, bottom: 18, minHeight: 48, borderRadius: 15, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 9, shadowColor: "#16213B", shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 }, toastSuccess: { backgroundColor: "#E7F8F1", borderWidth: 1, borderColor: "#BCEBDD" }, toastNeutral: { backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#D6DEFF" }, toastError: { backgroundColor: "#FFF0EE", borderWidth: 1, borderColor: "#F5C8C2" }, toastText: { flex: 1, color: "#263348", fontSize: 13, fontWeight: "800" }, modalOverlay: { flex: 1, backgroundColor: "rgba(20, 28, 48, 0.42)", justifyContent: "center", alignItems: "center", padding: 24 }, modalCard: { width: "100%", maxWidth: 360, borderRadius: 22, padding: 22, backgroundColor: "#FFFFFF", alignItems: "center", shadowColor: "#16213B", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 }, modalIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center", marginBottom: 12 }, modalTitle: { color: "#1D2433", fontSize: 18, fontWeight: "900" }, modalBody: { color: "#697386", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 9 }, modalActions: { width: "100%", flexDirection: "row", gap: 9, marginTop: 20 }, modalCancel: { flex: 1, height: 46, borderRadius: 13, backgroundColor: "#F0F2F6", alignItems: "center", justifyContent: "center" }, modalCancelText: { color: "#667085", fontSize: 14, fontWeight: "800" }, modalDelete: { flex: 1, height: 46, borderRadius: 13, backgroundColor: "#E45A4E", alignItems: "center", justifyContent: "center" }, modalDeleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, kicker: { color: "#697386", fontSize: 13, fontWeight: "700" }, title: { color: "#1D2433", fontSize: 28, fontWeight: "900", lineHeight: 35, letterSpacing: -0.6 }, subtitle: { color: "#697386", fontSize: 14, lineHeight: 21, marginTop: 5, marginBottom: 22 }, headerIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#E8EDFF", justifyContent: "center", alignItems: "center" }, sectionTitle: { color: "#1D2433", fontSize: 18, fontWeight: "800", marginTop: 22, marginBottom: 11 }, setHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }, resultCount: { color: "#8A94A8", fontSize: 11, fontWeight: "700" }, searchRow: { height: 47, borderRadius: 13, borderWidth: 1, borderColor: "#E5E8F0", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 8 }, searchInput: { flex: 1, color: "#1D2433", fontSize: 13, paddingVertical: 0 }, sortChips: { gap: 8, paddingTop: 9, paddingBottom: 2 }, sortChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#EEF1F6" }, sortChipActive: { backgroundColor: "#3653E8" }, sortChipText: { color: "#667085", fontSize: 12, fontWeight: "800" }, sortChipTextActive: { color: "#FFFFFF" }, emptyState: { marginTop: 12, borderRadius: 16, padding: 20, alignItems: "center", backgroundColor: "#F7F8FC" }, emptyTitle: { color: "#344054", fontSize: 14, fontWeight: "800", marginTop: 8 }, emptyBody: { color: "#8A94A8", fontSize: 12, marginTop: 4 }, count: { color: "#8791A5", fontSize: 14 }, inlineForm: { flexDirection: "row", gap: 9 }, inlineInput: { flex: 1, height: 48, paddingHorizontal: 14, backgroundColor: "#FFFFFF", borderRadius: 13, borderWidth: 1, borderColor: "#E5E8F0", color: "#1D2433", fontSize: 14 }, smallButton: { height: 48, borderRadius: 13, paddingHorizontal: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#3653E8" }, smallButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, chips: { gap: 8, paddingVertical: 11 }, chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: "#EEF1F6" }, chipText: { color: "#667085", fontSize: 13, fontWeight: "700" }, selectedChipText: { color: "#FFFFFF" }, formCard: { padding: 15, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E8F0", gap: 10 }, input: { minHeight: 47, paddingHorizontal: 13, borderRadius: 12, backgroundColor: "#F7F8FC", color: "#1D2433", fontSize: 14, fontWeight: "600" }, questionInput: { minHeight: 90, paddingTop: 13, textAlignVertical: "top" }, explanationInput: { minHeight: 70, paddingTop: 12, textAlignVertical: "top" }, formHint: { color: "#7B879C", fontSize: 12, fontWeight: "600" }, primaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: "#3653E8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, typeRow: { flexDirection: "row", gap: 8 }, typeButton: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center", backgroundColor: "#F0F2F7" }, typeButtonActive: { backgroundColor: "#E8EDFF" }, typeText: { color: "#697386", fontSize: 12, fontWeight: "800" }, typeTextActive: { color: "#3653E8" }, setCard: { minHeight: 71, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#E5E8F0", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", marginBottom: 9 }, setCardSelected: { borderColor: "#3653E8", backgroundColor: "#F8F9FF" }, setBadge: { width: 40, height: 40, borderRadius: 13, justifyContent: "center", alignItems: "center", marginRight: 11 }, setBadgeText: { color: "#3653E8", fontSize: 15, fontWeight: "900" }, setInfo: { flex: 1, marginRight: 10 }, setTitle: { color: "#101828", fontSize: 14, fontWeight: "900" }, setSubtitle: { color: "#536078", fontSize: 11, marginTop: 3, lineHeight: 16 }, problemRow: { minHeight: 68, padding: 12, borderRadius: 15, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E8F0", flexDirection: "row", alignItems: "center", marginBottom: 8 }, problemNumber: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#EEF1FF", justifyContent: "center", alignItems: "center", marginRight: 10 }, problemNumberText: { color: "#3653E8", fontSize: 12, fontWeight: "900" }, problemInfo: { flex: 1, marginRight: 9 }, problemLabel: { color: "#E45A4E", fontSize: 10, fontWeight: "800", marginBottom: 3 }, problemText: { color: "#101828", fontSize: 13, lineHeight: 18, fontWeight: "800" }, examButton: { minHeight: 51, borderRadius: 15, backgroundColor: "#0F9F78", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 16 }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
