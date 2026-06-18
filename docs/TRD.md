# TRD — Technical Requirements Document

## 1. 개요

| 항목 | 내용 |
|------|------|
| 제품명 | Kanban Board |
| 버전 | v1.0 |
| 작성일 | 2026-06-18 |

---

## 2. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 마크업 | HTML5 | Semantic elements (`<section>`, `<header>`, `<main>`) |
| 스타일 | CSS3 | Flexbox, CSS Custom Properties (변수) |
| 로직 | Vanilla JavaScript (ES2020+) | 프레임워크 없음 |
| 드래그앤드롭 | HTML5 Drag and Drop API | `draggable="true"` |
| 데이터 저장 | 브라우저 메모리 (JS 배열) | 새로고침 시 초기화 |
| 서버 | 없음 (파일 직접 열기 또는 `python3 -m http.server`) | |

---

## 3. 파일 구조

```
kanban/
├── index.html       # DOM 구조
├── style.css        # 스타일
├── script.js        # 로직
├── PLAN.md
├── CLAUDE.md
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
<header>
  <h1>Kanban Board</h1>
</header>

<main class="board">
  <section class="column" id="todo"         data-column="todo">
  <section class="column" id="in-progress"  data-column="in-progress">
  <section class="column" id="done"         data-column="done">
</main>
```

각 `<section>` 내부:
```html
<div class="column-header">
  <h2>컬럼명</h2>
  <span class="card-count">0</span>
</div>
<div class="cards">
  <div class="card" id="card-{id}" draggable="true">
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

### 5-1. 데이터 모델 (인메모리)

```js
// 카드 객체 구조
{
  id: string,        // "card-{Date.now()}" 또는 crypto.randomUUID()
  text: string,      // 카드 본문
  column: string,    // "todo" | "in-progress" | "done"
  createdAt: number  // Date.now()
}
```

### 5-2. 핵심 함수

| 함수 | 역할 |
|------|------|
| `createCard(text, columnId)` | 카드 DOM 생성 + 이벤트 바인딩 |
| `addCardToColumn(card, columnEl)` | 카드를 컬럼 `.cards`에 삽입 |
| `deleteCard(cardEl)` | 카드 DOM 제거 |
| `updateCardCount(columnEl)` | 컬럼 카드 수 뱃지 갱신 |
| `bindDragEvents(cardEl)` | dragstart/dragend 이벤트 연결 |
| `bindColumnDropEvents(columnEl)` | dragover/dragleave/drop 이벤트 연결 |
| `initSampleCards()` | 초기 샘플 카드 렌더링 |

### 5-3. 드래그앤드롭 이벤트 흐름

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
  └─ updateCardCount(모든 컬럼)

dragend (card)
  └─ card.classList.remove('dragging')
```

---

## 6. CSS 설계

- CSS Custom Properties (`:root`)로 색상·간격 토큰 정의
- Flexbox로 보드 3단 레이아웃 구현
- 반응형: `min-width` 768px 미만에서 세로 스택 전환

---

## 7. 브라우저 호환성

| 기능 | Chrome | Firefox | Edge | Safari |
|------|--------|---------|------|--------|
| HTML5 DnD API | ✅ | ✅ | ✅ | ✅ |
| CSS Flexbox | ✅ | ✅ | ✅ | ✅ |
| CSS Custom Properties | ✅ | ✅ | ✅ | ✅ |
| `crypto.randomUUID()` | ✅ 92+ | ✅ 95+ | ✅ 92+ | ✅ 15.4+ |

---

## 8. 향후 백엔드 연동 포인트

v3.0 백엔드 연동 시 변경 최소화를 위해 아래 인터페이스를 미리 정의한다.

```js
// v1.0: 인메모리 직접 조작
// v3.0: 아래를 fetch() API 호출로 교체 예정

async function getCards()                       // GET  /api/cards
async function createCard(text, column)         // POST /api/cards
async function moveCard(cardId, targetColumn)   // PATCH /api/cards/:id
async function deleteCard(cardId)               // DELETE /api/cards/:id
```

REST API 엔드포인트 상세는 `DATABASE.md` 참조.
