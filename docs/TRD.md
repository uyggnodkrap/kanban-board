# TRD — Technical Requirements Document

## 1. 개요

| 항목 | 내용 |
|------|------|
| 제품명 | Kanban Board |
| 버전 | v2.0 |
| 작성일 | 2026-06-18 |
| 배포 URL | https://uyggnodkrap.github.io/kanban-board |

---

## 2. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 마크업 | HTML5 | Semantic elements (`<section>`, `<header>`, `<main>`) |
| 스타일 | CSS3 | Flexbox, CSS Custom Properties (변수) |
| 로직 | Vanilla JavaScript (ES2020+) | 프레임워크 없음 |
| 드래그앤드롭 | HTML5 Drag and Drop API | `draggable="true"` |
| 인증 | Supabase Auth | 이메일/비밀번호, GitHub OAuth |
| 데이터베이스 | Supabase (PostgreSQL) | `cards` 테이블, RLS 적용 |
| Supabase SDK | `@supabase/supabase-js` v2 | CDN (`esm.sh`) |
| 빌드 | 없음 | 파일 수정 → 브라우저 새로고침으로 즉시 반영 |
| 배포 | GitHub Pages | `main` 브랜치 루트 디렉토리 |

---

## 3. 파일 구조

```
kanban/
├── index.html       # DOM 구조 (인증 패널 + 보드)
├── style.css        # 스타일 (인증 UI + 보드 컴포넌트)
├── auth.js          # Supabase 클라이언트 초기화, 인증 로직
├── script.js        # 칸반 보드 로직 (드래그앤드롭, CRUD + DB 연동)
├── CLAUDE.md
├── TASKS.md
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
    <div class="user-info">
      <span id="user-email"></span>
      <button id="btn-signout">로그아웃</button>
    </div>
  </header>
  <main class="board">
    <section class="column" id="todo"        data-column="todo">
    <section class="column" id="in-progress" data-column="in-progress">
    <section class="column" id="done"        data-column="done">
  </main>
</div>
```

각 `<section>` 내부:
```html
<div class="column-header">
  <h2>컬럼명</h2>
  <span class="card-count">0</span>
</div>
<div class="cards">
  <div class="card" id="card-{uuid}" draggable="true">
    <span class="card-text">내용</span>
    <button class="delete-btn" aria-label="카드 삭제">×</button>
  </div>
</div>
<form class="add-form">
  <input type="text" placeholder="새 카드 추가..." />
  <button type="submit">추가</button>
</form>
```

---

## 5. JavaScript 설계

### 5-1. auth.js — 인증 모듈

| 역할 | 구현 |
|------|------|
| Supabase 클라이언트 초기화 | `window.supabase.createClient(URL, ANON_KEY)` → `window.supabaseClient` |
| 인증 상태 감지 | `onAuthStateChange` → 로그인 시 보드 표시, 로그아웃 시 인증 패널 표시 |
| 이메일 로그인 | `signInWithPassword({ email, password })` |
| 회원가입 | `signUp({ email, password, options: { emailRedirectTo } })` |
| GitHub OAuth | `signInWithOAuth({ provider: 'github', options: { redirectTo } })` |
| 로그아웃 | `signOut()` |

`emailRedirectTo` / `redirectTo`: `window.location.origin + window.location.pathname`  
(로컬·GitHub Pages 양쪽에서 정확한 경로로 리다이렉트)

### 5-2. script.js — 보드 로직

| 함수 | 역할 |
|------|------|
| `initBoard()` | 로그인 후 호출: DB에서 카드 로드, 없으면 샘플 카드 삽입 |
| `createCardEl(card)` | 카드 DOM 생성 + 이벤트 바인딩 |
| `addCardToColumn(cardEl, columnEl)` | 카드를 컬럼 `.cards`에 삽입 + 뱃지 갱신 |
| `deleteCard(cardEl, cardId)` | DB 삭제 + DOM 제거 |
| `updateCardCount(columnEl)` | 컬럼 카드 수 뱃지 갱신 |
| `bindDragEvents(cardEl)` | dragstart/dragend 이벤트 연결 |
| `bindColumnDropEvents(columnEl)` | dragover/dragleave/drop 이벤트 연결 (drop 시 DB 업데이트) |

### 5-3. Supabase DB 연동

| 작업 | Supabase 호출 |
|------|-------------|
| 카드 목록 조회 | `supabaseClient.from('cards').select('*').order('created_at')` |
| 카드 생성 | `supabaseClient.from('cards').insert({ user_id, column_id, text })` |
| 카드 이동 | `supabaseClient.from('cards').update({ column_id }).eq('id', cardId)` |
| 카드 삭제 | `supabaseClient.from('cards').delete().eq('id', cardId)` |

### 5-4. 드래그앤드롭 이벤트 흐름

```
dragstart (card)
  └─ card.classList.add('dragging')
  └─ dataTransfer.setData('text/plain', card.id)

dragover (column)
  └─ e.preventDefault()   ← 드롭 허용
  └─ column.classList.add('drag-over')

dragleave (column)
  └─ column.classList.remove('drag-over')

drop (column)
  └─ column.classList.remove('drag-over')
  └─ cardId = dataTransfer.getData('text/plain')
  └─ column.querySelector('.cards').appendChild(card)
  └─ supabase.update({ column_id: column.dataset.column })
  └─ updateCardCount(모든 컬럼)

dragend (card)
  └─ card.classList.remove('dragging')
```

---

## 6. CSS 설계

- CSS Custom Properties (`:root`)로 색상·간격 토큰 정의
- Flexbox로 보드 3단 레이아웃 구현
- 인증 패널: 중앙 정렬 카드형 UI
- 반응형: `min-width` 768px 미만에서 세로 스택 전환

---

## 7. Supabase 설정

| 항목 | 값 |
|------|---|
| Project URL | `https://zezbzjttxfmjzdzmmhte.supabase.co` |
| Auth > Site URL | `https://uyggnodkrap.github.io/kanban-board` |
| Auth > Redirect URLs | `https://uyggnodkrap.github.io/kanban-board`, `https://uyggnodkrap.github.io/kanban-board/` |
| Auth > Providers | Email, GitHub OAuth |

---

## 8. 브라우저 호환성

| 기능 | Chrome | Firefox | Edge | Safari |
|------|--------|---------|------|--------|
| HTML5 DnD API | ✅ | ✅ | ✅ | ✅ |
| CSS Flexbox | ✅ | ✅ | ✅ | ✅ |
| CSS Custom Properties | ✅ | ✅ | ✅ | ✅ |
| `crypto.randomUUID()` | ✅ 92+ | ✅ 95+ | ✅ 92+ | ✅ 15.4+ |
| ES Modules (CDN) | ✅ | ✅ | ✅ | ✅ |
