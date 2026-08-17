# GitHub Pages 배포 안내서

이 문서는 `문제풀이 앱`을 GitHub Pages에서 정적 웹 서비스로 실행하는 절차를 설명합니다. 현재 프로젝트는 Expo 웹 정적 export를 지원하므로 별도의 Node.js 서버 없이 배포할 수 있습니다.

> **중요:** 현재 앱의 문제 세트, 답안, 채점 기록은 브라우저의 로컬 저장소에 저장됩니다. GitHub Pages에 배포한 뒤에도 서버 데이터베이스에 자동 동기화되지는 않으며, 브라우저·기기별로 데이터가 분리됩니다.

## 1. 사전 준비

Windows에 다음 프로그램이 설치되어 있어야 합니다.

| 프로그램 | 확인 명령 | 용도 |
|---|---|---|
| Node.js 20 이상 | `node --version` | 웹 export 및 패키지 실행 |
| npm | `npm --version` | 의존성 설치 및 스크립트 실행 |
| Git | `git --version` | 소스 저장소 업로드 |
| GitHub 계정 | 브라우저에서 확인 | 저장소 및 Pages 운영 |

PowerShell에서 프로젝트 폴더로 이동합니다.

```powershell
cd C:\Work\manus\playquiz
```

프로젝트 폴더가 다른 위치라면 위 경로를 실제 폴더 경로로 바꿉니다.

## 2. GitHub 저장소 만들기

GitHub에서 새 저장소를 만듭니다.

1. [GitHub](https://github.com)에 로그인합니다.
2. 오른쪽 위의 **New repository**를 선택합니다.
3. 저장소 이름을 입력합니다. 예를 들어 `playquiz`를 사용할 수 있습니다.
4. 공개 저장소인 **Public**을 선택합니다.
5. README, `.gitignore`, 라이선스는 추가하지 않고 빈 저장소로 생성하는 것을 권장합니다.
6. 저장소 주소를 복사합니다. 예: `https://github.com/사용자명/playquiz.git`

> 저장소 이름이 `사용자명.github.io`가 아닌 일반 프로젝트 저장소이면 Pages 주소는 보통 `https://사용자명.github.io/playquiz/` 형식입니다.

## 3. 로컬 프로젝트 점검

의존성을 설치합니다. 프로젝트에 `pnpm-lock.yaml`이 있으므로 `pnpm` 사용을 권장하지만, npm을 사용해도 됩니다.

### 권장: pnpm 사용

```powershell
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm install
```

### npm 사용

```powershell
npm install
```

타입 검사와 자동 테스트를 실행합니다.

```powershell
npm run check
npm run test
```

두 명령에서 오류가 없어야 다음 단계로 진행합니다.

## 4. 정적 웹 파일 생성

다음 명령을 실행합니다.

```powershell
npm run export:web
```

정상적으로 완료되면 다음 파일과 폴더가 생성됩니다.

```text
dist\index.html
dist\_expo\
dist\exam.html
dist\manage.html
dist\review.html
```

생성 여부를 확인합니다.

```powershell
Get-ChildItem .\dist\index.html
Get-ChildItem .\dist\_expo
```

`dist\index.html`이 없으면 export가 완료되지 않은 것이므로 오류 메시지를 먼저 확인합니다.

## 5. 로컬에서 정적 결과 확인

정적 파일은 파일을 직접 더블클릭하기보다 HTTP 서버로 실행해야 합니다. 별도 전역 설치 없이 다음 명령을 사용할 수 있습니다.

```powershell
npx serve .\dist
```

처음 실행할 때 `serve` 설치 여부를 물으면 `y`를 입력합니다. 표시된 주소를 브라우저에서 엽니다. 일반적으로 다음과 같은 주소입니다.

```text
http://localhost:3000
```

PowerShell 창은 서버가 실행되는 동안 계속 사용됩니다. 다른 명령을 입력하려면 새 PowerShell 창을 열거나 `Ctrl+C`로 서버를 종료합니다.

## 6. GitHub Actions workflow 추가

프로젝트 루트에 다음 폴더를 만듭니다.

```powershell
New-Item -ItemType Directory -Force .github\workflows
```

`.github\workflows\deploy-pages.yml` 파일을 만들고 아래 내용을 저장합니다.

```yaml
name: Deploy web app to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.12.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check types
        run: pnpm run check

      - name: Run tests
        run: pnpm run test

      - name: Export static web files
        run: pnpm run export:web

      # export:web가 GitHub Pages용 커스텀 dist/404.html을 자동 생성합니다.

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

PowerShell에서 파일을 메모장으로 열려면 다음 명령을 사용할 수 있습니다.

```powershell
notepad .github\workflows\deploy-pages.yml
```

> 위 workflow는 `main` 브랜치에 push할 때마다 테스트, 정적 export, Pages 배포를 자동으로 실행합니다.

## 7. GitHub에 소스 업로드

아직 Git 저장소가 아니라면 다음 명령을 실행합니다.

```powershell
git init
git branch -M main
git add .
git commit -m "Prepare app for GitHub Pages"
```

원격 저장소 주소를 연결합니다. 아래 주소의 `사용자명`과 `저장소명`을 실제 값으로 바꿉니다.

```powershell
git remote add origin https://github.com/사용자명/저장소명.git
```

원격 저장소에 업로드합니다.

```powershell
git push -u origin main
```

GitHub 로그인이나 인증을 요구하면 GitHub에서 안내하는 인증 절차를 완료합니다. 비밀번호 대신 Personal Access Token 또는 GitHub Credential Manager를 사용할 수 있습니다.

## 8. GitHub Pages 활성화

처음 push한 뒤 GitHub 저장소에서 다음 순서로 설정합니다.

1. 저장소의 **Settings**를 엽니다.
2. 왼쪽 메뉴에서 **Pages**를 선택합니다.
3. **Build and deployment**의 Source를 **GitHub Actions**로 설정합니다.
4. **Actions** 탭에서 `Deploy web app to GitHub Pages` workflow를 엽니다.
5. workflow가 초록색으로 완료될 때까지 기다립니다.
6. workflow의 deployment URL 또는 Settings → Pages에 표시된 주소를 엽니다.

프로젝트 저장소의 일반적인 주소는 다음과 같습니다.

```text
https://사용자명.github.io/저장소명/
```

## 9. 배포 후 확인 항목

다음 기능을 실제 Pages 주소에서 확인합니다.

| 확인 항목 | 테스트 방법 |
|---|---|
| 홈 화면 | Pages 주소 접속 후 추천 테스트 목록 표시 확인 |
| 시험 응시 | 문제 세트 선택 → 객관식 선택 → 다음 문제 이동 |
| 긴 선택지 목록 | 4번째 선택지와 하단 버튼이 겹치지 않는지 확인 |
| 채점 | 시험 제출 후 결과와 정답·해설 표시 확인 |
| 복습 | 오답 복습 화면과 재도전 흐름 확인 |
| 관리 | 과목·문제 세트·문항 추가 및 삭제 확인 |
| Markdown 업로드 | 관리 화면에서 `.md` 파일 업로드 확인 |
| 새로고침 | 현재 페이지에서 브라우저 새로고침 후 404가 발생하지 않는지 확인 |
| 로컬 저장 | 새로고침 후 추가한 문제와 학습 기록 유지 확인 |

## 10. 수정 사항 재배포

코드를 수정한 뒤에는 다음 명령만 반복하면 됩니다.

```powershell
cd C:\Work\manus\playquiz
npm run check
npm run test
git add .
git commit -m "Update problem solving app"
git push origin main
```

GitHub Actions가 자동으로 다시 실행되고, 성공하면 Pages 사이트가 갱신됩니다. 브라우저에 이전 화면이 보이면 `Ctrl+F5`로 강력 새로고침합니다.

## 11. 배포 실패 시 확인 명령

로컬 export 오류를 먼저 확인합니다.

```powershell
npm run export:web
```

Git 상태와 원격 저장소를 확인합니다.

```powershell
git status
git remote -v
git branch --show-current
```

GitHub Actions 오류는 저장소의 **Actions** 탭에서 실패한 작업을 열어 확인합니다. 특히 다음 항목을 확인합니다.

| 오류 | 조치 |
|---|---|
| `pnpm install --frozen-lockfile` 실패 | `pnpm-lock.yaml`을 함께 commit했는지 확인 |
| `dist/index.html` 없음 | `pnpm run export:web` 로그 확인 |
| Pages 권한 오류 | Settings → Actions → General에서 workflow 권한 확인 |
| 배포 후 빈 화면 | Pages 주소의 저장소 경로, 정적 자산 경로, 브라우저 개발자 도구 확인 |
| 새로고침 시 404 | `pnpm run export:web` 후 `dist/404.html`이 생성되는지 확인하고, workflow에서 해당 `dist` 폴더를 업로드하는지 확인 |

## 12. 배포 중단 또는 되돌리기

새로운 commit의 배포를 중단하려면 GitHub 저장소의 **Actions** 탭에서 실행 중인 workflow를 취소합니다. 이전 버전으로 되돌리려면 로컬에서 원하는 commit을 확인한 뒤 별도의 수정 commit을 만들어 push하는 방식을 권장합니다.

```powershell
git log --oneline -10
```

> GitHub Pages는 정적 웹 호스팅이므로, 현재처럼 브라우저 로컬 저장소만 사용하는 앱에 적합합니다. 여러 기기에서 문제와 학습 기록을 공유하려면 별도의 backend와 인증·데이터 저장 설계가 필요합니다.
