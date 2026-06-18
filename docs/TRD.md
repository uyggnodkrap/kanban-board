# TRD — Technical Requirements Document

## 1. 개요

| 항목 | 내용 |
|------|------|
| 제품명 | Kanban Board |
| 버전 | v3.0 |
| 작성일 | 2026-06-18 |
| 배포 URL | https://uyggnodkrap.github.io/kanban-board |

---

## 2. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 마크업 | HTML5 | Semantic elements (`<section>`, `<header>`, `<main>`, `<aside>`) |
| 스타일 | CSS3 | Flexbox, CSS Custom Properties (변수) |
| 로직 | Vanilla JavaScript (ES2020+) | 프레임워크 없음 |
| 드래그앤드롭 | HTML5 Drag and Drop API | `draggable="true"` |
| 인증 | Supabase Auth | 이메일/비밀번호, GitHub OAuth |
| 데이터베이스 | Supabase (PostgreSQL) | boards/cards/activity_log 등 5개 테이블, RLS 적용 |
| 실시간 | Supabase Realtime | Postgres Changes 구독 (cards, activity_log) |
| Supabase SDK | `@supabase/supabase-js` v2 | CDN (jsdelivr) |
| 빌드 | 없음 | 파일 수정 → 브라우저 새로고침으로 즉시 반영 |
| 배포 | GitHub Pages | `main` 브랜치 루트 디렉토리 |

---

## 3. 파일 구조

```
kanban/
├── index.html       # DOM 구조 (인증 패널 + 보드 + 활동로그 패널)
├── style.css        # 스타일 (인증 UI + 보드 + 사이드패널 + 토스트)
├── auth.js          # Supabase 클라이언트, 인증, 초대코드 감지
├── invite.js        # 보드 관리, 초대 링크 생성/수락, 토스트
├── script.js        # 칸반 보드 로직 (드래그앤드롭, CRUD, Realtime, 활동로그)
├── CLAUDE.md
├── TASKS.md
├── WORKFLOW.md
└── docs/
    ├── PRD.md
    ├── MRD.md
    ├── TRD.md          ← 현재 파일
    ├── USER_FLOW.md
    ├── DATABASE.md
    ├── DESIGN.md
    ├── DESIGN_SYSTEM.md
    └── TASKS.md
```

---

## 4. HTML 구조 명세

```html
<!-- 인증 패널 (로그인 전 표시) -->
<div id="auth-panel">
  <div id="view-signin">  <!-- 로그인 폼 -->
  <div id="view-signup">  <!-- 회원가입 폼 -->
  <div id="view-verify">  <!-- 이메일 인증 안내 -->
</div>

<!-- 보드 (로그인 후 표시) -->
<div id="board-wrapper" class="hidden">
  <header>
    <h1>Kanban Board</h1>
    <div class="header-right">
      <span id="user-email"></span>
      <button id="btn-invite" class="btn-invite">팀원 초대</button>
      <button id="btn-signout">로그아웃</button>
    </div>
  </header>

  <div id="board-area">
    <main class="board">
      <section class="column" id="todo"        data-column="todo">
      <section class="column" id="in-progress" data-column="in-progress">
      <section class="column" id="done"        data-column="done">
    </main>

    <aside id="activity-panel" class="activity-panel">
      <div class="activity-header"><h3>활동 로그</h3></div>
      <ul id="activity-list" class="activity-list"></ul>
    </aside>
  </div>

  <div id="toast" class="toast hidden"></div>
</div>
```

---

## 5. JavaScript 설계

### 5-1. auth.js — 인증 모듈

| 역할 | 구현 |
|------|------|
| Supabase 클라이언트 초기화 | `window.supabase.createClient(URL, ANON_KEY)` → `window.supabaseClient` |
| 초대 코드 감지 | 페이지 로드 시 `?invite=` 파라미터 → `sessionStorage` 저장 |
| 인증 상태 감지 | `onAuthStateChange` (async) → `window.currentUser` 설정 → `loadOrCreateBoard` 또는 `acceptInvite` → `initBoard` |
| 이메일 로그인 | `signInWithPassword({ email, password })` |
| 회원가입 | `signUp({ email, password, options: { emailRedirectTo } })` |
| GitHub OAuth | `signInWithOAuth({ provider: 'github', options: { redirectTo } })` — 초대 파라미터 보존 |
| 로그아웃 | `signOut()` → `window.currentUser`, `window.currentBoardId` 초기화 |

### 5-2. invite.js — 보드/초대 모듈

| 함수 | 역할 |
|------|------|
| `loadOrCreateBoard(user)` | boards 조회 → 없으면 INSERT → `window.currentBoardId` 설정 |
| `acceptInvite(user, code)` | 초대코드 검증 → 만료 확인 → board_members INSERT → activity_log 기록 |
| `generateInviteLink()` | board_invites INSERT → URL 생성 → 클립보드 복사 |
| `showToast(msg, isError)` | `#toast` 3초 표시 |

### 5-3. script.js — 보드 로직

| 함수 | 역할 |
|------|------|
| `initBoard()` | 로그인 후 호출: DB에서 카드 로드, Realtime 구독, 활동로그 초기화 |
| `createCard(text, id)` | 카드 DOM 생성 + 이벤트 바인딩 |
| `addCardToColumn(card, columnEl)` | 카드를 컬럼 `.cards`에 삽입 + 카운트 갱신 |
| `bindDragEvents(cardEl)` | dragstart/dragend 이벤트 연결 |
| `bindColumnDropEvents(columnEl)` | dragover/dragleave/drop 이벤트 연결 |
| `handleCardChange(payload)` | Realtime 카드 변경 처리 (INSERT/UPDATE/DELETE → DOM 반영) |
| `logActivity(action, details)` | activity_log INSERT (fire-and-forget) |
| `initActivityLog()` | 최근 50개 로그 로드 + Realtime 구독 |
| `renderActivityEntry(entry)` | 활동 로그 항목 DOM 생성 및 prepend |

### 5-4. Supabase DB 연동

| 작업 | Supabase 호출 |
|------|-------------|
| 카드 목록 조회 | `from('cards').select('*').eq('board_id', boardId).order('created_at')` |
| 카드 생성 | `from('cards').insert({ board_id, column_id, text })` |
| 카드 이동 | `from('cards').update({ column_id }).eq('id', cardId)` |
| 카드 삭제 | `from('cards').delete().eq('id', cardId)` |
| 활동 로그 조회 | `from('activity_log').select('*').eq('board_id', boardId).order('created_at', { ascending: false }).limit(50)` |

### 5-5. Realtime 구독

```js
// 카드 실시간 (INSERT/UPDATE/DELETE)
supabaseClient.channel('cards-' + boardId)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'cards',
      filter: `board_id=eq.${boardId}` }, handleCardChange)
  .subscribe();

// 활동 로그 실시간 (INSERT)
supabaseClient.channel('log-' + boardId)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log',
      filter: `board_id=eq.${boardId}` }, (p) => renderActivityEntry(p.new))
  .subscribe();
```

### 5-6. 드래그앤드롭 이벤트 흐름

```
dragstart (card)  → classList.add('dragging'), dataTransfer.setData(card.id)
dragover (column) → preventDefault(), classList.add('drag-over')
dragleave (column)→ classList.remove('drag-over')
drop (column)     → DB update(column_id), DOM 이동, logActivity('card_moved')
dragend (card)    → classList.remove('dragging')
```

---

## 6. CSS 설계

- CSS Custom Properties (`:root`)로 색상·간격 토큰 정의
- `#board-area`: Flexbox로 보드 + 활동로그 패널 가로 배치
- `.board`: `flex: 1`로 남은 공간 차지
- `.activity-panel`: `width: 260px`, `position: sticky`
- 인증 패널: 중앙 정렬 카드형 UI
- 반응형: 768px 미만에서 `#board-area` 세로 스택, `.activity-panel` 전체 너비

---

## 7. 전역 상태

| 변수 | 설정 위치 | 역할 |
|------|----------|------|
| `window.supabaseClient` | auth.js | Supabase 클라이언트 인스턴스 |
| `window.currentUser` | auth.js | 현재 로그인 유저 객체 |
| `window.currentBoardId` | invite.js | 현재 활성 보드 UUID |
| `window._boardEventsInitialized` | script.js | 폼/드래그 이벤트 중복 바인딩 방지 플래그 |

---

## 8. Supabase 설정

| 항목 | 값 |
|------|---|
| Project URL | `https://zezbzjttxfmjzdzmmhte.supabase.co` |
| Auth > Site URL | `https://uyggnodkrap.github.io/kanban-board` |
| Auth > Redirect URLs | `https://uyggnodkrap.github.io/kanban-board`, `https://uyggnodkrap.github.io/kanban-board/` |
| Auth > Providers | Email, GitHub OAuth |
| Database > Replication | cards, activity_log Realtime 활성화 |

---

## 9. 브라우저 호환성

| 기능 | Chrome | Firefox | Edge | Safari |
|------|--------|---------|------|--------|
| HTML5 DnD API | ✅ | ✅ | ✅ | ✅ |
| CSS Flexbox | ✅ | ✅ | ✅ | ✅ |
| CSS Custom Properties | ✅ | ✅ | ✅ | ✅ |
| Clipboard API | ✅ 66+ | ✅ 63+ | ✅ 79+ | ✅ 13.1+ |
| ES Modules (CDN) | ✅ | ✅ | ✅ | ✅ |
