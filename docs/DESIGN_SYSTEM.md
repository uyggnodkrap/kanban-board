# Design System

## 1. 개요

칸반보드의 디자인 토큰, 컴포넌트 클래스, 상태 스타일을 정의하는 단일 참조 문서다.

---

## 2. Design Tokens (CSS Custom Properties)

모든 토큰은 `style.css`의 `:root` 블록에 정의한다.

```css
:root {
  /* Color */
  --color-bg:             #f0f2f5;
  --color-column-bg:      #f4f5f7;
  --color-column-hover:   #e2e8f0;
  --color-card-bg:        #ffffff;
  --color-primary:        #3b82f6;
  --color-primary-hover:  #2563eb;
  --color-text-primary:   #1e293b;
  --color-text-secondary: #64748b;
  --color-danger:         #ef4444;
  --color-border:         #cbd5e1;

  /* Spacing */
  --space-xs:  0.25rem;   /*  4px */
  --space-sm:  0.5rem;    /*  8px */
  --space-md:  0.75rem;   /* 12px */
  --space-lg:  1rem;      /* 16px */
  --space-xl:  1.5rem;    /* 24px */
  --space-2xl: 2rem;      /* 32px */

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadow */
  --shadow-card:       0 1px 3px rgba(0, 0, 0, 0.10);
  --shadow-card-hover: 0 4px 8px rgba(0, 0, 0, 0.15);

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg:   1.5rem;    /* 24px */

  /* Transition */
  --transition-fast:   0.1s ease;
  --transition-normal: 0.15s ease;
}
```

---

## 3. 컴포넌트 클래스 명세

### 3-1. `.board`

보드 전체 컨테이너.

```css
.board {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-xl);
  min-height: 100vh;
  background: var(--color-bg);
  align-items: flex-start;
}
```

---

### 3-2. `.column`

개별 컬럼 컨테이너.

```css
.column {
  flex: 1;
  min-width: 260px;
  min-height: 500px;
  background: var(--color-column-bg);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

/* 드롭 대상 강조 */
.column.drag-over {
  background: var(--color-column-hover);
  outline: 2px dashed var(--color-border);
  outline-offset: -2px;
}
```

---

### 3-3. `.column-header`

컬럼 헤더 (제목 + 카드 수 뱃지).

```css
.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.column-header h2 {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.card-count {
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: var(--color-border);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 2px 8px;
}
```

---

### 3-4. `.cards`

카드 목록 컨테이너.

```css
.cards {
  min-height: 40px;  /* 빈 컬럼에도 드롭 영역 확보 */
  margin-bottom: var(--space-md);
}
```

---

### 3-5. `.card`

개별 카드.

```css
.card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
  background: var(--color-card-bg);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  cursor: grab;
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-normal),
              opacity var(--transition-fast);
  user-select: none;
}

/* hover */
.card:hover {
  box-shadow: var(--shadow-card-hover);
}

/* 드래그 중 */
.card.dragging {
  opacity: 0.4;
  cursor: grabbing;
}

.card-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.5;
  flex: 1;
}
```

---

### 3-6. `.delete-btn`

카드 삭제 버튼.

```css
.delete-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  padding: 0;
  line-height: 1;
  transition: color var(--transition-fast);
}

.delete-btn:hover {
  color: var(--color-danger);
}
```

---

### 3-7. `.add-form`

카드 추가 폼.

```css
.add-form {
  display: flex;
  gap: var(--space-sm);
}

.add-form input {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  outline: none;
}

.add-form input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.add-form input::placeholder {
  color: var(--color-text-secondary);
}

.add-form button {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
}

.add-form button:hover {
  background: var(--color-primary-hover);
}
```

---

## 4. 상태 정의

| 컴포넌트 | 상태 | 클래스 | 설명 |
|---------|------|--------|------|
| Card | 기본 | `.card` | 정상 표시 |
| Card | 드래그 중 | `.card.dragging` | opacity 0.4, cursor grabbing |
| Column | 기본 | `.column` | 정상 배경 |
| Column | 드롭 대상 | `.column.drag-over` | 배경 변경 + 점선 테두리 |
| Input | 기본 | — | 회색 테두리 |
| Input | 포커스 | `:focus` | 파란 테두리 + 글로우 |
| DeleteBtn | 기본 | `.delete-btn` | 회색 |
| DeleteBtn | hover | `.delete-btn:hover` | 빨간색 |

---

## 5. 반응형 브레이크포인트

| 브레이크포인트 | 기준 | 레이아웃 변화 |
|-------------|------|-------------|
| Desktop | `≥ 1024px` | 3컬럼 가로 배치 |
| Tablet | `768px ~ 1023px` | 3컬럼 가로 (축소) |
| Mobile | `< 768px` | 세로 스택 (v1.1 대응) |

```css
@media (max-width: 767px) {
  .board {
    flex-direction: column;
  }
  .column {
    min-width: unset;
    width: 100%;
  }
}
```

---

## 6. 네이밍 컨벤션

| 분류 | 패턴 | 예시 |
|------|------|------|
| 컴포넌트 클래스 | 케밥케이스 | `.column-header`, `.add-form` |
| 상태 클래스 | 단어 | `.dragging`, `.drag-over` |
| CSS 변수 | `--{카테고리}-{이름}` | `--color-primary`, `--space-lg` |
| 카드 ID | `card-{uuid}` | `card-abc123` |
| 컬럼 ID | 케밥케이스 | `todo`, `in-progress`, `done` |
