# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

이 디렉토리(`day03/kanban/`)와 그 하위 디렉토리만 읽고 수정한다.

## Commands

```bash
# 로컬 개발 서버 실행 (file:// 프로토콜 대신 반드시 사용)
python3 -m http.server 3000
# → http://localhost:3000 접속

# WSL2에서 브라우저 열기
cmd.exe /c start http://localhost:3000
```

빌드 단계 없음. 파일을 수정하면 브라우저 새로고침으로 즉시 반영된다.

## Architecture

빌드 툴 없는 순수 HTML/CSS/JS 앱. 3개 파일로 구성된다.

```
kanban/
├── index.html   # DOM 구조: 3개 컬럼(Todo / In Progress / Done), 카드 추가 폼
├── style.css    # Flexbox 보드 레이아웃, 카드 스타일, 드래그 시각 피드백
└── script.js    # HTML5 Drag and Drop API 이벤트 처리, 카드 추가/삭제
```

### 드래그앤드롭 이벤트 흐름

| 이벤트 | 대상 | 동작 |
|--------|------|------|
| `dragstart` | `.card` | `.dragging` 클래스 추가, `dataTransfer`에 카드 id 저장 |
| `dragend` | `.card` | `.dragging` 클래스 제거 |
| `dragover` | `.column` | `preventDefault()` + `.drag-over` 클래스 추가 |
| `dragleave` | `.column` | `.drag-over` 클래스 제거 |
| `drop` | `.column` | 카드를 해당 컬럼 `.cards`에 `appendChild` |

## Git

브랜치 통합 시 **반드시 merge**를 사용한다. rebase는 금지한다.

```bash
# 올바른 방법
git merge <branch>
git pull origin main --no-edit

# 사용 금지
git rebase <branch>
```

## Verification

검증 시 **Playwright는 사용하지 않는다.** 아래 방법으로 수동 확인한다.

1. `python3 -m http.server 3000` 실행
2. `cmd.exe /c start http://localhost:3000` 으로 브라우저 열기
3. 브라우저에서 직접 기능 확인 (드래그앤드롭, 카드 추가/삭제)

## Task Tracking

작업이 완료될 때마다 **반드시 `TASKS.md`를 업데이트**한다.

- 완료된 작업은 `TASKS.md`에 완료 상태로 기록한다.
- `TASKS.md`가 없으면 새로 생성한다.
- 작업 항목 형식: `- [x] 작업 내용` (완료), `- [ ] 작업 내용` (미완료)

## Environment

- WSL2 환경
- 브라우저 열기: `cmd.exe /c start <url>`
- 외부 의존성 없음 (CDN, npm 미사용)
