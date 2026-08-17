# 문제풀이 앱 Windows 로컬 실행 가이드

이 문서는 `C:\Work\manus\playquiz`에 압축을 해제한 문제풀이 앱을 **npm 기준**으로 설치하고 실행하는 방법을 설명합니다. 개발 중에는 Expo 개발 서버를 사용하고, 정적 웹사이트가 필요할 때는 `dist\index.html`을 생성합니다.

## 1. 필수 프로그램 설치

Windows에 [Node.js LTS](https://nodejs.org/)를 설치합니다. 설치 후 PowerShell을 새로 열고 버전을 확인합니다.

```powershell
node --version
npm --version
```

프로젝트를 npm으로 실행하므로 별도의 pnpm 설치는 필요하지 않습니다.

## 2. 프로젝트 폴더로 이동

ZIP을 `C:\Work\manus\playquiz`에 압축 해제했다면 다음 명령을 실행합니다.

```powershell
cd C:\Work\manus\playquiz
Get-ChildItem package.json
```

`package.json` 파일이 바로 표시되어야 합니다. 표시되지 않으면 프로젝트 폴더가 한 단계 더 중첩되어 있는지 확인하세요.

## 3. 의존성 설치

```powershell
npm install
```

처음 설치할 때는 시간이 걸릴 수 있습니다. 프로젝트가 Expo SDK에 맞는 패키지를 사용하므로 Expo 패키지는 다음처럼 설치하는 것이 안전합니다.

```powershell
npx expo install expo-file-system babel-preset-expo
```

`expo-file-system/legacy` 또는 `babel-preset-expo` 관련 오류가 발생했을 때도 위 명령을 다시 실행하면 됩니다.

## 4. 타입 검사와 자동 테스트

```powershell
npm run check
npm test
```

`npm run check`에서 TypeScript 오류가 없어야 하며, `npm test`에서 문제 데이터·Markdown 파서 테스트가 통과해야 합니다.

## 5. 개발 서버로 웹 실행

개발 중에는 다음 명령을 사용합니다.

```powershell
npm run dev
```

서버 실행 후 브라우저에서 다음 주소를 엽니다.

```text
http://localhost:8081
```

관리 화면은 다음 주소로 바로 열 수 있습니다.

```text
http://localhost:8081/manage
```

개발 서버는 실행 중인 PowerShell 창을 계속 사용합니다. 추가 명령은 새 PowerShell 창에서 실행하고, 서버를 종료할 때는 실행 창에서 `Ctrl+C`를 누릅니다.

## 6. 앱 기능 테스트 순서

웹 미리보기에서 다음 흐름을 확인합니다.

| 기능 | 확인 방법 |
|---|---|
| 시험 응시 | 오늘 화면에서 시험 시작 → 답안 선택 또는 입력 → 다음 문제 |
| 자동 채점 | 마지막 문항에서 답안 제출 → 점수와 문제별 결과 확인 |
| 오답 복습 | 복습 탭 → 문제 선택 → 답안 확인 → 해설 확인 |
| 문제 세트 추가 | 관리 탭 → 과목 선택 → 문제 세트 추가 |
| 문제 추가 | 문제 세트 선택 → 문제 유형·본문·정답·해설 입력 → 문제 추가 |
| 문제 삭제 | 문제 오른쪽 휴지통 아이콘 → 확인 팝업에서 삭제하기 |
| 문제 세트 삭제 | 문제 세트 삭제 아이콘 → 확인 모달 → 삭제하기 또는 취소 |
| Markdown 가져오기 | 관리 탭 → Markdown 파일 선택 → 성공 토스트와 문항 수 확인 |
| 검색·정렬 | 관리 탭 → 검색어 입력 → 최신순·이름순 선택 |

## 7. 정적 `index.html` 생성

정적 웹사이트로 실행할 파일을 생성하려면 개발 서버를 먼저 `Ctrl+C`로 종료한 뒤 다음 명령을 실행합니다.

```powershell
cd C:\Work\manus\playquiz
npm run export:web
```

정상적으로 완료되면 출력 마지막에 다음과 비슷한 메시지가 표시됩니다.

```text
Exported: dist
```

생성 결과를 확인합니다.

```powershell
Get-ChildItem .\dist
Get-ChildItem .\dist\index.html
```

다음 두 항목이 있어야 합니다.

```text
dist\index.html
dist\_expo\
```

`dist` 폴더가 비어 있거나 `index.html`이 없으면 export 과정에서 오류가 발생한 것입니다. 이 경우 `npm run export:web`의 오류 메시지를 확인해야 합니다.

## 8. 정적 파일 서버로 `index.html` 실행

`index.html`을 더블클릭해 `file://` 방식으로 열지 말고 정적 HTTP 서버로 실행합니다.

```powershell
npx serve -s "C:\Work\manus\playquiz\dist"
```

설치 확인 메시지가 나오면 `y`를 입력합니다. 서버가 실행되면 터미널에 표시된 주소를 브라우저에서 엽니다. 일반적으로 다음 주소입니다.

```text
http://localhost:3000
```

`npx serve dist` 실행 후 PowerShell이 추가 명령을 받지 않는 것은 정상입니다. 해당 창은 서버 실행 전용으로 두고, 다른 명령은 새 PowerShell 창에서 실행합니다. 서버를 종료하려면 실행 중인 창에서 `Ctrl+C`를 누릅니다.

## 9. 정적 export가 실패할 때

### `Missing script: export:web` 오류

ZIP이 이전 버전이라 `export:web` 스크립트가 없을 수 있습니다. 다음 명령으로 직접 실행합니다.

```powershell
npx expo export --platform web
```

### `Cannot find module 'babel-preset-expo'` 오류

```powershell
npx expo install babel-preset-expo
npm run export:web
```

### `Cannot find module 'expo-file-system/legacy'` 오류

```powershell
npx expo install expo-file-system
npm run check
npm run export:web
```

### `dist` 폴더가 비어 있는 경우

정적 서버를 먼저 종료하고, 반드시 `package.json`이 있는 프로젝트 폴더에서 export를 다시 실행합니다.

```powershell
Ctrl+C
cd C:\Work\manus\playquiz
npm run export:web
Get-ChildItem .\dist\index.html
```

### `Index of dist/` 화면이 나오는 경우

`serve`는 실행 중이지만 `dist\index.html`이 없다는 뜻입니다. 먼저 `npm run export:web`을 성공시키고, `dist\index.html`이 생성된 뒤 정적 서버를 다시 실행하세요.

### npm의 `node-linker` 경고

다음 경고는 pnpm 전용 설정을 npm이 읽어서 표시하는 것이며, 일반적으로 실행을 막지 않습니다.

```text
npm warn Unknown project config "node-linker"
```

경고를 없애려면 프로젝트의 `.npmrc`에서 `node-linker` 줄을 삭제하거나 주석 처리할 수 있습니다.

## 10. 실행 방식 요약

개발 중 소스 수정 사항을 자동 반영하려면 다음 명령을 사용합니다.

```powershell
npm run dev
```

정적 `index.html`을 생성하고 실행하려면 다음 명령을 사용합니다.

```powershell
npm run export:web
npx serve -s "C:\Work\manus\playquiz\dist"
```

정적 실행 중 소스를 수정한 경우에는 반드시 `npm run export:web`을 다시 실행하고, 브라우저에서 `Ctrl+F5`로 강력 새로고침해야 합니다.
