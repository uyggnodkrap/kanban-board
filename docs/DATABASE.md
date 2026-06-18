# Database Design

## 1. 개요

| 항목 | 내용 |
|------|------|
| 현재 (v3.0) | Supabase (PostgreSQL) — 클라우드 관리형 DB |
| 인증 | Supabase Auth (auth.users 테이블 자동 관리) |
| 보안 | Row Level Security (RLS) — 보드 멤버십 기반 데이터 격리 |
| 실시간 | Supabase Realtime — cards, activity_log 테이블 변경 구독 |

---

## 2. 스키마 — Supabase PostgreSQL

### 2-1. boards 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 보드 고유 ID |
| owner_id | UUID | NOT NULL, FK → auth.users(id) | 보드 소유자 |
| name | TEXT | NOT NULL, DEFAULT 'My Board' | 보드 이름 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 |

```sql
CREATE TABLE boards (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL DEFAULT 'My Board',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "board_access" ON boards FOR SELECT
  USING (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM board_members WHERE board_members.board_id = boards.id AND board_members.user_id = auth.uid()
  ));
CREATE POLICY "board_owner_write" ON boards FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
```

---

### 2-2. board_invites 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 초대 고유 ID |
| board_id | UUID | NOT NULL, FK → boards(id) | 대상 보드 |
| code | TEXT | NOT NULL, UNIQUE | 초대 코드 (32자 hex) |
| created_by | UUID | NOT NULL, FK → auth.users(id) | 초대 생성자 |
| expires_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()+7일 | 만료일시 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 |

```sql
CREATE TABLE board_invites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  code       TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID        NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE board_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite_read_auth"    ON board_invites FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "invite_owner_write"  ON board_invites FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "invite_owner_delete" ON board_invites FOR DELETE USING (
  EXISTS (SELECT 1 FROM boards WHERE boards.id = board_id AND boards.owner_id = auth.uid())
);
```

---

### 2-3. board_members 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| board_id | UUID | PK, FK → boards(id) | 보드 ID |
| user_id | UUID | PK, FK → auth.users(id) | 멤버 사용자 ID |
| joined_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 합류일시 |

```sql
CREATE TABLE board_members (
  board_id  UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read"       ON board_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "member_self_insert" ON board_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "member_remove"      ON board_members FOR DELETE
  USING (user_id = auth.uid() OR board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid()));
```

---

### 2-4. cards 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 카드 고유 ID |
| board_id | UUID | NOT NULL, FK → boards(id) | 소속 보드 |
| column_id | TEXT | NOT NULL | 소속 컬럼 ('todo' \| 'in-progress' \| 'done') |
| text | TEXT | NOT NULL | 카드 내용 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 |

```sql
CREATE TABLE cards (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  column_id  TEXT        NOT NULL,
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE cards REPLICA IDENTITY FULL;

CREATE POLICY "board_members_cards" ON cards FOR ALL
  USING (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
    OR board_id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
    OR board_id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
  );
```

---

### 2-5. activity_log 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 로그 고유 ID |
| board_id | UUID | NOT NULL, FK → boards(id) | 대상 보드 |
| user_id | UUID | NOT NULL, FK → auth.users(id) | 행위자 |
| user_email | TEXT | NOT NULL | 행위자 이메일 (스냅샷) |
| action | TEXT | NOT NULL | 행위 유형 |
| card_id | UUID | FK → cards(id) ON DELETE SET NULL | 대상 카드 (선택) |
| card_text | TEXT | | 카드 텍스트 스냅샷 |
| from_col | TEXT | | 이동 출발 컬럼 |
| to_col | TEXT | | 이동 도착 컬럼 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 기록일시 |

`action` 가능 값: `card_added` \| `card_deleted` \| `card_moved` \| `member_joined`

```sql
CREATE TABLE activity_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id),
  user_email TEXT        NOT NULL,
  action     TEXT        NOT NULL,
  card_id    UUID        REFERENCES cards(id) ON DELETE SET NULL,
  card_text  TEXT,
  from_col   TEXT,
  to_col     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE activity_log REPLICA IDENTITY FULL;

CREATE POLICY "log_read" ON activity_log FOR SELECT
  USING (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
    OR board_id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
  );
CREATE POLICY "log_insert" ON activity_log FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
    OR board_id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid()))
);
```

---

## 3. 테이블 관계도

```
auth.users
    │
    ├──► boards (owner_id)
    │        │
    │        ├──► board_invites (board_id)
    │        ├──► board_members (board_id)
    │        ├──► cards (board_id)
    │        └──► activity_log (board_id)
    │
    ├──► board_members (user_id)
    └──► activity_log (user_id)
```

---

## 4. Supabase API 연동

| 작업 | 코드 |
|------|------|
| 보드 조회 | `supabaseClient.from('boards').select('id').eq('owner_id', userId)` |
| 보드 생성 | `supabaseClient.from('boards').insert({ owner_id, name })` |
| 초대 링크 생성 | `supabaseClient.from('board_invites').insert({ board_id, created_by })` |
| 멤버 합류 | `supabaseClient.from('board_members').insert({ board_id, user_id })` |
| 카드 목록 조회 | `supabaseClient.from('cards').select('*').eq('board_id', boardId)` |
| 카드 생성 | `supabaseClient.from('cards').insert({ board_id, column_id, text })` |
| 카드 이동 | `supabaseClient.from('cards').update({ column_id }).eq('id', cardId)` |
| 카드 삭제 | `supabaseClient.from('cards').delete().eq('id', cardId)` |
| 활동 로그 기록 | `supabaseClient.from('activity_log').insert({ board_id, user_id, user_email, action, ... })` |

---

## 5. Supabase 프로젝트 설정

| 항목 | 값 |
|------|---|
| Project URL | `https://zezbzjttxfmjzdzmmhte.supabase.co` |
| Site URL | `https://uyggnodkrap.github.io/kanban-board` |
| Redirect URLs | `https://uyggnodkrap.github.io/kanban-board`, `https://uyggnodkrap.github.io/kanban-board/` |
| Realtime | cards, activity_log 테이블 활성화 필요 |
