# Database Design

## 1. 개요

| 항목 | 내용 |
|------|------|
| 현재 (v1.0) | 브라우저 인메모리 (JS 배열 + DOM) |
| 단기 (v1.1) | LocalStorage |
| 장기 (v3.0) | MySQL 또는 PostgreSQL + REST API |

---

## 2. Phase 1: 현재 — 인메모리 (v1.0)

### 데이터 구조

```js
// 브라우저 메모리에만 존재. 새로고침 시 초기화.
const cards = [
  { id: 'card-1', text: '기획서 작성', column: 'todo',        createdAt: 1718700000000 },
  { id: 'card-2', text: '디자인 검토', column: 'in-progress', createdAt: 1718700001000 },
  { id: 'card-3', text: '배포 완료',   column: 'done',        createdAt: 1718700002000 },
];
```

### 제약 사항

- 페이지 새로고침 시 모든 데이터 소실
- 탭 간 공유 불가
- 서버 없이 동작하는 대신 영속성 없음

---

## 3. Phase 2: 단기 — LocalStorage (v1.1)

### 저장 방식

```js
// 저장
localStorage.setItem('kanban_cards', JSON.stringify(cards));

// 불러오기
const cards = JSON.parse(localStorage.getItem('kanban_cards') ?? '[]');
```

### 스키마 (JSON)

```json
[
  {
    "id": "card-abc123",
    "text": "기획서 작성",
    "column": "todo",
    "position": 0,
    "createdAt": 1718700000000,
    "updatedAt": 1718700000000
  }
]
```

### 제약 사항

- 브라우저 스토리지 한계 (~5MB)
- 동일 브라우저·도메인 내에서만 공유
- 멀티 디바이스 동기화 불가

---

## 4. Phase 3: 장기 — RDB 연동 (v3.0)

### 4-1. ERD (Entity Relationship Diagram)

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────────┐
│   boards    │       │    columns      │       │     cards        │
├─────────────┤       ├─────────────────┤       ├──────────────────┤
│ id (PK)     │──┐    │ id (PK)         │──┐    │ id (PK)          │
│ name        │  └──► │ board_id (FK)   │  └──► │ column_id (FK)   │
│ created_at  │       │ name            │       │ title            │
│ updated_at  │       │ position        │       │ description      │
└─────────────┘       │ created_at      │       │ position         │
                      │ updated_at      │       │ created_at       │
                      └─────────────────┘       │ updated_at       │
                                                └──────────────────┘
```

### 4-2. 테이블 정의

#### boards

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT / BIGINT | PK, AUTO_INCREMENT | 보드 고유 ID |
| name | VARCHAR(100) | NOT NULL | 보드 이름 |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | 수정일시 |

#### columns

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT / BIGINT | PK, AUTO_INCREMENT | 컬럼 고유 ID |
| board_id | INT / BIGINT | FK → boards.id | 소속 보드 |
| name | VARCHAR(50) | NOT NULL | 컬럼명 (예: Todo) |
| position | TINYINT | NOT NULL, DEFAULT 0 | 컬럼 순서 (0-based) |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT NOW() | 수정일시 |

#### cards

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT / BIGINT | PK, AUTO_INCREMENT | 카드 고유 ID |
| column_id | INT / BIGINT | FK → columns.id | 소속 컬럼 |
| title | VARCHAR(255) | NOT NULL | 카드 제목 |
| description | TEXT | NULL | 카드 상세 내용 (향후) |
| position | INT | NOT NULL, DEFAULT 0 | 컬럼 내 카드 순서 |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT NOW() | 수정일시 |

---

### 4-3. DDL — MySQL

```sql
CREATE DATABASE kanban
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kanban;

CREATE TABLE boards (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE columns (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  board_id   BIGINT      NOT NULL,
  name       VARCHAR(50) NOT NULL,
  position   TINYINT     NOT NULL DEFAULT 0,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_columns_board FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cards (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  column_id   BIGINT       NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  position    INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cards_column FOREIGN KEY (column_id) REFERENCES columns (id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

### 4-4. DDL — PostgreSQL

```sql
CREATE DATABASE kanban
  ENCODING 'UTF8'
  LC_COLLATE 'ko_KR.UTF-8'
  TEMPLATE template0;

\c kanban;

CREATE TABLE boards (
  id         BIGSERIAL    PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE columns (
  id         BIGSERIAL   PRIMARY KEY,
  board_id   BIGINT      NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name       VARCHAR(50) NOT NULL,
  position   SMALLINT    NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cards (
  id          BIGSERIAL    PRIMARY KEY,
  column_id   BIGINT       NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  position    INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- updated_at 자동 갱신 트리거 (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_boards_updated_at  BEFORE UPDATE ON boards  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_columns_updated_at BEFORE UPDATE ON columns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cards_updated_at   BEFORE UPDATE ON cards   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### 4-5. REST API 엔드포인트 명세

| 메서드 | 경로 | 설명 | 요청 바디 | 응답 |
|--------|------|------|---------|------|
| GET | `/api/boards/:boardId/cards` | 전체 카드 조회 | — | `Card[]` |
| POST | `/api/boards/:boardId/cards` | 카드 생성 | `{title, column_id}` | `Card` |
| PATCH | `/api/cards/:cardId` | 카드 이동 (컬럼 변경) | `{column_id, position}` | `Card` |
| DELETE | `/api/cards/:cardId` | 카드 삭제 | — | `204 No Content` |

---

### 4-6. 마이그레이션 전략

v1.0 → v3.0 전환 시 프론트엔드 변경 최소화:

1. `script.js`에서 직접 DOM 조작하던 카드 CRUD 함수들을 `api.js`로 분리
2. `api.js`의 각 함수를 `fetch()` 기반 REST 호출로 교체
3. HTML/CSS는 변경 없이 유지
