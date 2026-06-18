# Tasks — 구현 태스크 체크리스트

## 1. 개요

칸반보드 구현 태스크를 Phase별로 정의한다.

---

## 2. Phase 0: 문서화

- [x] PLAN.md 작성
- [x] CLAUDE.md 작성
- [x] docs/PRD.md 작성
- [x] docs/MRD.md 작성
- [x] docs/TRD.md 작성
- [x] docs/USER_FLOW.md 작성
- [x] docs/DATABASE.md 작성
- [x] docs/DESIGN.md 작성
- [x] docs/DESIGN_SYSTEM.md 작성
- [x] docs/TASKS.md 작성

---

## 3. Phase 1: HTML 구조 구현

- [x] `index.html` 파일 생성
- [x] 인증 패널 (`#auth-panel`) — 로그인/회원가입/이메일인증 뷰 3종
- [x] 보드 래퍼 (`#board-wrapper`) — 헤더 + 3컬럼 보드
- [x] `<header>` — 보드 제목 + 사용자 이메일 + 로그아웃 버튼
- [x] Todo / In Progress / Done 컬럼 `<section>` 작성
- [x] `<link rel="stylesheet" href="style.css">` 연결
- [x] Supabase CDN 스크립트 로드 (`esm.sh`)
- [x] `<script src="auth.js" type="module">` 연결
- [x] `<script src="script.js" type="module">` 연결

---

## 4. Phase 2: CSS 스타일 구현

- [x] `style.css` 파일 생성
- [x] `:root` — CSS 토큰 정의 (색상, 간격, 반경, 그림자, 폰트)
- [x] 인증 패널 스타일 (중앙 정렬, 카드형 UI)
- [x] 인증 폼 스타일 (입력 필드, 에러 메시지)
- [x] GitHub 로그인 버튼 스타일 (`.btn-github`)
- [x] `header` — 보드 헤더 (제목 + 유저 정보)
- [x] `.board` — Flexbox 3단 레이아웃
- [x] `.column` — 컬럼 기본 스타일
- [x] `.column.drag-over` — 드롭 대상 강조 스타일
- [x] `.card` — 카드 기본 스타일 (배경, 그림자, 패딩)
- [x] `.card:hover` / `.card.dragging` — 인터랙션 스타일
- [x] `.delete-btn` — 삭제 버튼 스타일
- [x] `.add-form` — 카드 추가 폼 스타일
- [x] `@media (max-width: 767px)` — 모바일 세로 스택

---

## 5. Phase 3: Supabase 인증 구현 (auth.js)

- [x] Supabase 클라이언트 초기화 (`window.supabaseClient`)
- [x] `onAuthStateChange` — 로그인/로그아웃 상태 감지 → 화면 전환
- [x] 이메일/비밀번호 로그인 (`signInWithPassword`)
- [x] 이메일/비밀번호 회원가입 (`signUp` + `emailRedirectTo`)
- [x] GitHub OAuth 로그인 (`signInWithOAuth` + `redirectTo`)
- [x] 로그아웃 (`signOut`)
- [x] `redirectTo`: `window.location.origin + window.location.pathname` (GitHub Pages 대응)
- [x] 인증 뷰 전환 헬퍼 (`showView`, `showBoard`, `showAuth`)

---

## 6. Phase 4: 칸반 보드 + DB 연동 구현 (script.js)

- [x] `initBoard()` — DB에서 카드 로드, 없으면 샘플 카드 삽입
- [x] `createCardEl(card)` — 카드 DOM 생성 + 이벤트 바인딩
- [x] `addCardToColumn(cardEl, columnEl)` — 카드 삽입 + 뱃지 갱신
- [x] `deleteCard(cardEl, cardId)` — DB 삭제 + DOM 제거
- [x] `updateCardCount(columnEl)` — 카드 수 뱃지 갱신
- [x] 드래그앤드롭 이벤트 (dragstart/dragend/dragover/dragleave/drop)
- [x] drop 시 Supabase `update({ column_id })` 호출
- [x] 카드 추가 폼 submit → Supabase `insert` → DOM 추가
- [x] 빈 텍스트 입력 차단

---

## 7. Phase 5: Supabase 설정

- [x] Supabase 프로젝트 생성
- [x] `cards` 테이블 생성 (id, user_id, column_id, text, created_at)
- [x] Row Level Security (RLS) 활성화 + 정책 설정
- [x] GitHub OAuth Provider 활성화
- [x] Site URL: `https://uyggnodkrap.github.io/kanban-board`
- [x] Redirect URLs 추가 (GitHub Pages URL)

---

## 8. Phase 6: GitHub Pages 배포

- [x] GitHub 저장소 생성 (`kanban-board`)
- [x] 코드 푸시 (`main` 브랜치)
- [x] GitHub Pages 활성화 (Settings > Pages > main / root)
- [x] `auth.js` redirectTo 경로 수정 (`+ window.location.pathname`)
- [x] 배포 확인: `https://uyggnodkrap.github.io/kanban-board`

---

## 9. Phase 7: 검증

- [x] GitHub Pages 접속 확인 (HTTP 200)
- [x] 이메일 회원가입 + 인증 메일 발송 확인
- [x] 이메일 로그인 확인
- [x] GitHub OAuth 로그인 확인
- [x] 로그아웃 확인
- [x] 카드 추가 → DB 저장 → 새로고침 후 유지 확인
- [x] 카드 드래그앤드롭 이동 → DB 반영 확인
- [x] 카드 삭제 → DB 반영 확인
- [x] 모바일 레이아웃 확인

---

## 10. 향후 작업 (v3.0)

- [ ] 모바일 터치 드래그앤드롭 지원
- [ ] 카드 텍스트 인라인 편집 기능
- [ ] 카드 순서 정렬 (컬럼 내 위치 지정)
- [ ] 마감일, 라벨 등 카드 메타데이터
- [ ] DB 요청 실패 시 UI 에러 처리
