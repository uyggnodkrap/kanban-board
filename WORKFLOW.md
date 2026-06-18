# WORKFLOW

작업 세션별 프롬프트와 수행 내역을 기록한다.  
프롬프트는 원문 그대로, 작업 내역은 요약하여 작성한다.

> **참고:** 세션 1~4는 `/clear` 이후 재구성한 기록이다. git 히스토리와 TASKS.md를 근거로 작성했으며, 실제 프롬프트 문구는 추정이다.

---

## 세션 1 — 칸반보드 기본 구현

**프롬프트:**
> HTML/CSS/JS로 드래그앤드롭 칸반보드를 만들어줘. 컬럼은 Todo, In Progress, Done 3개.

**작업 요약:**
- `PLAN.md` 작성 — 파일 구성, HTML 구조, CSS 핵심 규칙, JS 로직 설계
- `index.html` — 3컬럼 구조, 샘플 카드, 카드 추가 폼 구현
- `style.css` — Flexbox 보드 레이아웃, 카드 스타일, 드래그 시각 피드백(`.dragging`, `.drag-over`)
- `script.js` — HTML5 Drag and Drop API 이벤트 처리, 카드 추가/삭제 기능

---

## 세션 2 — Supabase 인증 연동

**프롬프트:**
> Supabase 이메일 인증을 붙여줘. 로그인/회원가입/로그아웃.

**작업 요약:**
- `index.html` — 인증 패널(로그인/회원가입 폼) + 칸반 보드 레이아웃 재구성
- `auth.js` 신규 작성 — Supabase 클라이언트 초기화, 이메일/패스워드 회원가입·로그인·로그아웃 처리
- 인증 상태에 따른 UI 전환(인증 패널 ↔ 보드) 로직 구현

---

## 세션 3 — Supabase DB 연동 (카드 영속화)

**프롬프트:**
> 카드 데이터를 Supabase DB에 저장해줘. 새로고침해도 유지되어야 해.

**작업 요약:**
- Supabase `cards` 테이블 스키마 설계 및 CRUD 연동
- 카드 추가 → `INSERT`, 카드 삭제 → `DELETE`, 컬럼 이동 → `UPDATE` 반영
- 페이지 로드 시 DB에서 카드 목록 `SELECT` 후 렌더링

---

## 세션 4 — GitHub 소셜 로그인 + GitHub Pages 배포

**프롬프트:**
> GitHub 소셜 로그인 추가해줘. 그리고 GitHub Pages에 배포해줘.

**작업 요약:**
- `auth.js` — GitHub OAuth 소셜 로그인 버튼 및 `signInWithOAuth` 처리 추가
- GitHub Pages 배포 시 `redirectTo` 경로 불일치 수정 (`fix: GitHub Pages 배포를 위한 redirectTo 경로 수정`)
- Supabase 대시보드에서 GitHub Pages URL을 허용 리다이렉트 URL로 등록

---

## 세션 5 — 문서 최신화 (v2.0)

**프롬프트:**
> 문서를 v2.0 기준으로 전체 최신화해줘.

**작업 요약:**
- `docs/` 디렉토리 내 문서 전체 갱신 (`DATABASE.md`, `DESIGN.md`, `DESIGN_SYSTEM.md`, `MRD.md`, `PRD.md`, `TRD.md`, `USER_FLOW.md`, `TASKS.md`)
- Supabase 인증·DB 연동, GitHub 로그인, Pages 배포를 반영한 내용으로 업데이트

---

## 세션 7 — 보드 공유 + 활동 로그

**프롬프트:**
> 같이 플랜짜자 만들어진 kanban보드를 팀원과 공유할 수 있게 한다. 활동로그를 기록한다.

**작업 요약:**
- 플랜 수립: boards/board_invites/board_members/activity_log 테이블 설계, cards 마이그레이션 전략, Realtime 구독 설계
- `invite.js` 신규 작성 — `loadOrCreateBoard`, `acceptInvite` (초대코드 검증→멤버 등록), `generateInviteLink` (클립보드 복사), `showToast`
- `auth.js` 수정 — 페이지 로드 시 `?invite=` 감지 및 sessionStorage 저장, `onAuthStateChange` 비동기화, `window.currentUser` 노출, GitHub OAuth redirectTo에 쿼리파라미터 보존
- `script.js` 수정 — `user_id` → `board_id` 전환, `logActivity` (fire-and-forget), `initActivityLog` + Realtime 구독, `handleCardChange` (타 멤버 카드 변경 실시간 반영), `buildActivityLi` / `renderActivityEntry` (활동로그 UI)
- `index.html` 수정 — `#board-area` 래퍼, `<aside id="activity-panel">`, `#btn-invite`, `#toast`, `invite.js` script 태그 추가
- `style.css` 수정 — `#board-area` 레이아웃, `.activity-panel` 고정 사이드바, `.btn-invite`, `.toast`, 모바일 반응형

---

## 세션 6 — WORKFLOW.md 도입

**프롬프트:**
> 내가 전달한 프롬프트와 그에 상응해서 네가 한 작업을 정리해서 WORKFLOW.md로 저장해줘. 프롬프트는 그대로 써야하고, 작업은 요약해서 작성해주면 돼. 이 내용을 CLAUDE.md에 반영해서 앞으로는 작업 시 WORKFLOW.md를 갱신해줘

**작업 요약:**
- `WORKFLOW.md` 신규 작성 — 이전 세션 기록 재구성 및 문서화
- `CLAUDE.md` 업데이트 — 작업 완료 시 `WORKFLOW.md` 갱신 규칙 추가
