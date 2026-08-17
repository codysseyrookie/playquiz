# AGENTS.md

## 프로젝트 개요

이 저장소는 사용자가 문제 세트를 선택해 시험에 응시하고, 객관식·단답형·서술형 답안을 작성한 뒤 자동 채점과 오답 복습을 수행하는 모바일 친화적 Expo 웹앱입니다. 기본 배포 대상은 **GitHub Pages 정적 웹앱**이며, 별도의 서버 DB나 사용자 계정 동기화는 현재 사용하지 않습니다.

주요 사용자 흐름은 다음과 같습니다.

```text
홈 → 문제 세트 선택 → 시험 응시 → 답안 작성 → 답안 제출 → 채점 결과 → 오답 복습
관리 → 과목·문제 세트·문항 추가/삭제 → Markdown 가져오기 → 즉시 응시
```

## 기술 스택

| 구분 | 기술 |
|---|---|
| 앱 | Expo SDK 54, React 19, React Native 0.81 |
| 라우팅 | Expo Router |
| 언어 | TypeScript |
| 스타일 | NativeWind 4, StyleSheet, Pretendard 웹 폰트 |
| 상태 관리 | React Context (`StudyProvider`) |
| 로컬 저장 | `@react-native-async-storage/async-storage` |
| 테스트 | Vitest |
| 정적 배포 | Expo Web Static Export + GitHub Pages |
| 패키지 관리자 | pnpm 9.12.0 권장 |

## 프로젝트 구조

```text
app/
  _layout.tsx                 # 전역 Provider, Router, Safe Area
  (tabs)/
    _layout.tsx               # 하단 탭 설정
    index.tsx                 # 홈·추천 테스트
    exam.tsx                  # 시험 응시·답안 작성·제출
    manage.tsx                # 과목·세트·문항 관리·Markdown 가져오기
    review.tsx                # 오답 복습 목록
    progress.tsx              # 학습 기록
  result.tsx                  # 채점 결과
  review/[id].tsx             # 개별 문항 해설·복습
components/
  screen-container.tsx        # Safe Area와 화면 배경 처리
lib/
  study-data.ts               # Problem, ProblemSet, ExamResult 타입과 채점 함수
  study-provider.tsx          # 문제·답안·시험 결과 전역 상태
  study-storage.ts            # AsyncStorage 키·저장·복원·시험 초안
  markdown-import.ts          # Markdown 문제 세트 파서
  theme-provider.tsx          # 밝은 테마 Provider
assets/images/                # 앱 아이콘·스플래시·favicon
scripts/
  prepare-local-static.mjs    # 정적 export 자산 경로와 404.html 준비
.github/workflows/
  deploy-pages.yml            # GitHub Pages 자동 배포
404.html                      # GitHub Pages 새로고침·알 수 없는 경로 대응
app.config.ts                 # Expo 설정과 /playquiz baseUrl
metro.config.js               # NativeWind·Metro CI 설정
package.json                  # 실행·검사·export 명령
```

## 로컬 개발 환경

Windows에서는 **Node.js 22 LTS**와 **pnpm 9.12.0**을 사용합니다. Node.js 26에서는 `tsx` 내부 esbuild 바이너리 버전 불일치가 발생할 수 있으므로 권장하지 않습니다.

```powershell
cd C:\Work\manus\playquiz
node -v
pnpm -v
pnpm install
pnpm run dev
```

브라우저 접속 주소는 다음과 같습니다.

```text
http://localhost:8081
```

`npm run dev`도 사용할 수 있지만, 내부적으로 `pnpm dev:server`와 `pnpm dev:metro`를 호출하므로 pnpm이 반드시 설치되어 있어야 합니다. `node-linker` 관련 npm 경고는 현재 실행 실패의 직접 원인이 아닙니다.

개발 서버가 실행되지 않을 때는 먼저 기존 터미널에서 `Ctrl+C`를 누릅니다. 포트 점유 상태는 다음 명령으로 확인합니다.

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
```

필요할 때 점유 프로세스를 종료합니다.

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }
```

`package.json`의 `dev:metro`는 Windows 호환을 위해 포트 `8081`을 고정합니다. Unix식 `${EXPO_PORT:-8081}` 표현을 다시 넣지 않습니다. Windows에서 해당 표현은 `NaN` 포트 오류를 일으킬 수 있습니다.

## 정적 웹 export

GitHub Pages와 같은 정적 결과를 로컬에서 확인하려면 다음 명령을 사용합니다.

```powershell
cd C:\Work\manus\playquiz
pnpm run export:web
Get-ChildItem .\dist\index.html
Get-ChildItem .\dist\404.html
npx serve dist -l 4173
```

정적 실행 주소:

```text
http://localhost:4173
```

`dist` 폴더가 다른 서버나 파일 탐색기에서 사용 중이면 Windows에서 `EBUSY` 오류가 발생할 수 있습니다. `npx serve dist`를 먼저 `Ctrl+C`로 종료한 뒤 export합니다.

정적 export 명령은 `expo export --platform web --clear` 후 `scripts/prepare-local-static.mjs`를 실행합니다. 이 스크립트는 상대 자산 경로, GitHub Pages용 `404.html`, 정적 라우트 준비를 담당합니다.

## GitHub Pages 배포

현재 repository 이름은 `playquiz`이며, Expo Router는 repository 하위 경로를 사용하도록 설정되어 있습니다.

```text
https://codysseyrookie.github.io/playquiz/
```

`app.config.ts`의 `experiments`에는 다음 설정이 필요합니다.

```ts
experiments: {
  baseUrl: "/playquiz",
  typedRoutes: true,
  reactCompiler: true,
},
```

배포는 `.github/workflows/deploy-pages.yml`이 담당합니다. workflow는 다음 순서로 실행되어야 합니다.

```text
Checkout → pnpm 설치 → Node 설정 → 의존성 설치 → 타입 검사 → 테스트
→ 정적 export → 404 복사 → Pages artifact 업로드 → Pages 배포
```

의존성 설치는 CI lockfile 차이 때문에 다음 명령을 사용합니다.

```yaml
run: pnpm install --no-frozen-lockfile
```

Metro·NativeWind CI 오류 방지를 위해 export 단계의 환경 변수도 유지합니다.

```yaml
env:
  CI: "1"
  EXPO_NO_METRO_WORKSPACE_ROOT: "1"
```

GitHub Pages에서 새로고침이 404로 끝나지 않도록 `dist/404.html`이 artifact에 반드시 포함되어야 합니다. `dist/index.html`을 404로 덮어쓰는 방식은 사용하지 않습니다. 커스텀 404 페이지가 repository base path와 라우트를 처리합니다.

일반적인 소스 반영 명령:

```powershell
cd C:\Work\manus\playquiz
git status
git add .
git commit -m "Describe the change"
git push origin main
```

`dist`는 Git에 직접 올리지 않습니다. GitHub Actions가 source에서 다시 생성합니다.

## 저장과 답안 처리

현재 저장 방식은 서버 DB가 아닌 브라우저·기기 로컬 저장입니다. 웹에서는 GitHub Pages 주소와 브라우저에 종속되며, 다른 기기와 자동 동기화되지 않습니다.

`study-storage.ts`의 주요 저장 키는 다음과 같습니다.

| 키 | 용도 |
|---|---|
| `problem-solving-library-v2` | 과목·문제·문제 세트 |
| `problem-solving-study-history-v1` | 제출된 시험 결과·점수·시도 답안 |
| `problem-solving-exam-draft-v1` | 제출 전 입력 중인 시험 답안 초안 |

시험 답안은 `setAnswer`로 메모리 상태에 반영되고, 변경 후 시험 초안으로 자동 저장됩니다. 재진입 시 제목·문제 목록·답안을 복원합니다. 제출 시 `gradeAnswers`가 `Attempt[]`를 만들고 `ExamResult`를 학습 기록에 추가한 후 임시 초안을 삭제합니다.

서버 DB, 사용자 인증, 노트북·모바일 자동 동기화는 현재 범위가 아닙니다. 기기 간 이동이 필요하면 추후 JSON 백업 내보내기·가져오기를 추가하거나 별도 backend를 설계합니다.

## 문제와 채점 규칙

`lib/study-data.ts`에서 공유 타입과 채점 규칙을 관리합니다.

- `Problem.type`: `multiple`, `short`, `long`
- 객관식은 선택지 문자열을 정답과 비교합니다.
- 단답형·서술형은 `answer`와 `acceptedAnswers`를 사용합니다.
- 비교 전 `normalizeAnswer`가 공백, 구두점, 괄호, 화살표 등을 정리합니다.
- 문제를 추가할 때 정답과 해설을 반드시 함께 입력합니다.
- 기존 문제 ID는 변경하지 않는 것이 좋습니다. 학습 기록의 `problemId`가 ID를 참조합니다.

## Markdown 가져오기

관리 화면은 `.md` 또는 텍스트 파일을 읽어 문제 세트를 생성합니다. 파서 변경 시 다음 요소를 확인합니다.

```text
제목·과목·문항 번호·문제 본문·선택지·정답·해설·문제 유형
```

Markdown 형식을 변경할 때는 `tests/markdown-import.test.ts`에 실제 예시를 추가합니다. 업로드 성공·취소·형식 오류·읽기 실패는 관리 화면 토스트로 구분합니다.

## 검사 명령

```powershell
pnpm run check
pnpm run test
pnpm run export:web
```

현재 기대되는 테스트 상태는 Vitest 기준 **9개 통과, auth logout 테스트 1개는 환경상 skip 가능**입니다. 타입 검사와 export가 실패하면 먼저 실패한 단계의 마지막 오류를 확인합니다.

Metro SHA-1 오류가 발생하면 다음 순서를 따릅니다.

```text
1. Node.js 22 LTS인지 확인
2. node_modules 삭제
3. pnpm store prune
4. pnpm install --force
5. CI=1 및 EXPO_NO_METRO_WORKSPACE_ROOT=1로 export
```

`metro.config.js`의 NativeWind output 설정과 `global.css`의 Pretendard import를 임의로 제거하지 않습니다.

## UI·코드 규칙

모바일 세로 화면과 한 손 사용을 기준으로 합니다. 모든 화면은 `ScreenContainer`를 사용하고, 긴 콘텐츠는 `ScrollView` 또는 `FlatList`로 감쌉니다. 하단 탭이나 고정 footer에 콘텐츠가 가리지 않도록 충분한 `paddingBottom`을 유지합니다.

버튼은 NativeWind `className` 대신 React Native `style`을 사용합니다. 모든 주요 버튼에는 동작과 pressed 상태가 있어야 하며, 빈 `onPress`를 남기지 않습니다. 텍스트 대비를 유지하고, 선택지의 현재 크기와 최소 높이를 임의로 낮추지 않습니다.

웹의 기본 글꼴은 Pretendard입니다.

```css
font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

시험 선택지는 모바일 가독성을 위해 17px 글꼴과 68px 이상의 최소 높이를 사용합니다.

## 변경 작업 체크리스트

코드 변경 전에는 `todo.md`에 작업을 추가합니다. 기능을 완료하면 즉시 완료 표시로 바꿉니다. 다음 항목을 확인한 뒤 사용자에게 전달합니다.

```text
[ ] 타입 검사
[ ] 자동 테스트
[ ] 정적 export
[ ] dist/index.html 확인
[ ] dist/404.html 확인
[ ] GitHub Pages 하위 경로 확인
[ ] 저장·복원 흐름 확인
[ ] 변경 파일 commit 여부 확인
```

## 주의사항

`pnpm-lock.yaml`은 의존성 설치 오류가 없다면 삭제하지 않습니다. GitHub Pages의 정적 JavaScript에 GitHub Personal Access Token을 넣지 않습니다. `dist`를 직접 commit하지 않고 workflow에서 생성합니다. 사용자의 Windows 폴더는 Manus 작업 환경과 자동 동기화되지 않으므로, 변경 사항은 ZIP 덮어쓰기 또는 Git commit·push로 명시적으로 전달해야 합니다.

문서 작성일: 2026-08-17
프로젝트명: 문제풀이 앱 (`problem-solving-app`)
