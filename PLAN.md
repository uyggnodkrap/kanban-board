# 칸반보드 구현 계획

## 개요

HTML / CSS / JS 3개의 파일로 드래그앤드롭이 가능한 칸반보드를 구현한다.
컬럼 구성: **Todo → In Progress → Done**

---

## 파일 구성

| 파일 | 역할 |
|------|------|
| `index.html` | 전체 구조: 3개 컬럼, 카드, 카드 추가 폼 |
| `style.css` | 레이아웃(Flexbox), 카드 스타일, 드래그 시각 피드백 |
| `script.js` | 드래그앤드롭 로직, 카드 추가/삭제 기능 |

---

## index.html 구조

```html
<header>        <!-- 제목 -->
<main class="board">
  <section class="column" id="todo">
    <h2>Todo</h2>
    <div class="cards">
      <div class="card" draggable="true">카드 내용 <button class="delete">×</button></div>
      ...
    </div>
    <form class="add-form">
      <input type="text" placeholder="새 카드 추가..." />
      <button type="submit">추가</button>
    </form>
  </section>

  <section class="column" id="in-progress">...</section>
  <section class="column" id="done">...</section>
</main>
```

- 각 컬럼에 동일한 구조(cards 컨테이너 + 추가 폼)
- 초기 샘플 카드 2~3개 하드코딩

---

## style.css 핵심 규칙

```css
/* 보드 레이아웃 */
.board {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  align-items: flex-start;
}

/* 컬럼 */
.column {
  flex: 1;
  min-height: 500px;
  background: #f4f5f7;
  border-radius: 8px;
  padding: 1rem;
}

/* 카드 */
.card {
  background: white;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 드래그 중인 카드 */
.card.dragging {
  opacity: 0.4;
  cursor: grabbing;
}

/* 드롭 가능 컬럼 강조 */
.column.drag-over {
  background: #e2e8f0;
  outline: 2px dashed #94a3b8;
}
```

---

## script.js 로직

### 드래그앤드롭 (HTML5 Drag and Drop API)

| 이벤트 | 대상 | 동작 |
|--------|------|------|
| `dragstart` | `.card` | `.dragging` 클래스 추가, `dataTransfer`에 카드 id 저장 |
| `dragend` | `.card` | `.dragging` 클래스 제거 |
| `dragover` | `.column` | `e.preventDefault()`, `.drag-over` 클래스 추가 |
| `dragleave` | `.column` | `.drag-over` 클래스 제거 |
| `drop` | `.column` | `.drag-over` 제거, 드래그된 카드를 해당 컬럼 `.cards`에 `appendChild` |

### 카드 추가

1. 각 컬럼 하단 `<form>` submit 이벤트 감지
2. input 값으로 새 카드 DOM 생성
3. 새 카드에 dragstart/dragend 이벤트 및 삭제 버튼 이벤트 연결
4. 해당 컬럼 `.cards` 컨테이너에 삽입

### 카드 삭제

- 카드 내 `×` 버튼 클릭 → `card.remove()`

### 카드 ID 부여

```js
card.id = `card-${Date.now()}`;
// 또는
card.id = `card-${crypto.randomUUID()}`;
```

---

## 구현 순서

1. `index.html` — 기본 구조 및 샘플 카드 작성
2. `style.css` — 보드/컬럼/카드 레이아웃 및 드래그 피드백 스타일
3. `script.js` — 드래그앤드롭 이벤트 연결, 카드 추가/삭제 기능

---

## 검증 방법

1. `index.html`을 브라우저에서 직접 열기 (서버 불필요)
2. 카드를 다른 컬럼으로 드래그하여 이동 확인
3. 각 컬럼 하단 폼으로 카드 추가 확인
4. `×` 버튼으로 카드 삭제 확인
5. 드래그 중 시각 피드백 확인 (카드 투명화, 컬럼 하이라이트)
