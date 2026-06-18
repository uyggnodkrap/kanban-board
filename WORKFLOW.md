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

## 세션 6 — WORKFLOW.md 도입

**프롬프트:**
> 내가 전달한 프롬프트와 그에 상응해서 네가 한 작업을 정리해서 WORKFLOW.md로 저장해줘. 프롬프트는 그대로 써야하고, 작업은 요약해서 작성해주면 돼. 이 내용을 CLAUDE.md에 반영해서 앞으로는 작업 시 WORKFLOW.md를 갱신해줘

**작업 요약:**
- `WORKFLOW.md` 신규 작성 — 이전 세션 기록 재구성 및 문서화
- `CLAUDE.md` 업데이트 — 작업 완료 시 `WORKFLOW.md` 갱신 규칙 추가

---

## 세션 7 — 보드 공유 + 활동 로그 구현

**프롬프트:**
> 같이 플랜짜자 만들어진 kanban보드를 팀원과 공유할 수 있게 한다. 활동로그를 기록한다.

**작업 요약:**
- 플랜 수립: boards/board_invites/board_members/activity_log 테이블 설계, cards 마이그레이션 전략, Realtime 구독 설계
- `invite.js` 신규 작성 — `loadOrCreateBoard`, `acceptInvite` (초대코드 검증→멤버 등록), `generateInviteLink` (클립보드 복사), `showToast`
- `auth.js` 수정 — 페이지 로드 시 `?invite=` 감지 및 sessionStorage 저장, `onAuthStateChange` 비동기화, `window.currentUser` 노출, GitHub OAuth redirectTo에 쿼리파라미터 보존
- `script.js` 수정 — `user_id` → `board_id` 전환, `logActivity` (fire-and-forget), `initActivityLog` + Realtime 구독, `handleCardChange` (타 멤버 카드 변경 실시간 반영), `buildActivityLi` / `renderActivityEntry` (활동로그 UI)
- `index.html` 수정 — `#board-area` 래퍼, `<aside id="activity-panel">`, `#btn-invite`, `#toast`, `invite.js` script 태그 추가
- `style.css` 수정 — `#board-area` 레이아웃, `.activity-panel` 고정 사이드바, `.btn-invite`, `.toast`, 모바일 반응형
- Supabase DB Step 1 실행 후 로컬 서버 기동 (`python3 -m http.server 3000`)

---

## 세션 8 — RLS 무한 재귀 버그 수정

**프롬프트:**
> supabase.js:20 POST .../boards?... 500 (Internal Server Error)  
> invite.js:33 보드 생성 실패: infinite recursion detected in policy for relation 'boards'

**작업 요약:**
- **원인**: `boards` SELECT 정책이 `board_members`를 참조하고, `board_members` SELECT 정책이 다시 `board_members` 자신을 서브쿼리로 참조 → 무한 재귀 발생
- **수정**: `board_members` SELECT 정책을 자기 참조 없이 단순화
  ```sql
  DROP POLICY "members_read" ON board_members;
  CREATE POLICY "members_read" ON board_members FOR SELECT
    USING (user_id = auth.uid());
  ```
- GitHub Pages 배포 (`git push origin main`)

---

## 세션 9 — cards.user_id 컬럼 제거 및 RLS 정리

**프롬프트:**
> supabase.js:20 POST .../cards?... 400 (Bad Request)  
> script.js:290 샘플 카드 삽입 실패: null value in column 'user_id'

**작업 요약:**
- **원인**: `cards` 테이블에 `user_id NOT NULL` 컬럼이 남아 있어 신규 코드(`board_id`만 사용)와 충돌
- **컬럼 제거 차단 문제**: Supabase 자동 생성 RLS 정책 4개("Users see own cards" 등)가 `user_id`를 참조해 `DROP COLUMN` 실패
- **수정**: 관련 RLS 정책 전체 삭제 후 컬럼 제거
  ```sql
  DROP POLICY IF EXISTS "Users see own cards" ON cards;
  DROP POLICY IF EXISTS "Users insert own cards" ON cards;
  DROP POLICY IF EXISTS "Users update own cards" ON cards;
  DROP POLICY IF EXISTS "Users delete own cards" ON cards;
  DROP POLICY IF EXISTS "users_own_cards" ON cards;
  ALTER TABLE cards DROP COLUMN user_id;
  ```
- `board_members_cards` 정책은 이미 생성되어 있어 중복 생성 시도 에러 → 해당 줄 건너뜀

---

## 세션 10 — board_invites INSERT RLS 403 수정

**프롬프트:**
> supabase.js:20 POST .../board_invites?... 403 (Forbidden)  
> invite.js:121 초대 링크 생성 실패: new row violates row-level security policy

**작업 요약:**
- **원인**: `invite_owner_write` 정책이 `EXISTS (SELECT 1 FROM boards WHERE ...)` 교차 테이블 참조를 사용 → boards RLS가 또 다른 board_members 참조를 유발해 정책 체인 실패
- **수정**: 정책을 단순 `created_by = auth.uid()` 조건으로 교체
  ```sql
  DROP POLICY "invite_owner_write" ON board_invites;
  CREATE POLICY "invite_owner_write" ON board_invites FOR INSERT
    WITH CHECK (created_by = auth.uid());
  ```

---

## 세션 11 — activity_log FK 위반 버그 수정

**프롬프트:**
> supabase.js:20 POST .../activity_log 409 (Conflict)  
> 삭제 버튼 누르면 저런 오류가 나와

**작업 요약:**
- **원인**: `card_deleted` 이벤트에서 카드를 DB에서 삭제한 후 `logActivity('card_deleted', { card_id: id, ... })` 호출 → 이미 삭제된 카드 ID를 FK로 참조해 `activity_log_card_id_fkey` 위반
- **수정**: `card_deleted` 로그에서 `card_id`를 전달하지 않음 (`card_id: null` 기본값 사용)
  ```js
  // script.js:57
  logActivity('card_deleted', { card_text: cardText }); // card_id 전달 안 함
  ```
- 수정 후 배포 (`git push origin main`)
- 브라우저 캐시로 이전 코드가 실행되는 현상 발생 → Ctrl+Shift+R 강제 새로고침으로 해결

---

## 세션 12 — docs v3.0 최신화 + WORKFLOW.md 갱신

**프롬프트:**
> 커밋하고 푸시한 다음 docs 파일을 최신화 하고 WORKFLOW.md 최신화해줘

**작업 요약:**
- 이전 커밋 및 푸시는 이미 완료된 상태 (git status: clean)
- `docs/DATABASE.md` — v3.0 스키마 (boards, board_invites, board_members, activity_log 테이블 추가, cards.user_id 제거, cards.board_id 추가, RLS 최종 정책 반영)
- `docs/PRD.md` — v3.0 (FR-08 보드 공유, FR-09 활동 로그, FR-10 실시간 동기화 추가, 팀/협업 기능 Out of Scope 항목 제거)
- `docs/TRD.md` — v3.0 (파일 구조에 invite.js 추가, JS 설계 섹션에 invite.js/script.js 함수 목록, Realtime 구독 코드, 전역 상태 테이블 추가)
- `docs/USER_FLOW.md` — v3.0 (Flow 10~12 추가: 팀원 초대, 초대 링크로 보드 합류, 실시간 동기화)
- `WORKFLOW.md` — 세션 8~12 추가 (디버깅 세션들, 현재 문서 갱신)
