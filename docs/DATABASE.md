# Database Design

## 1. 개요

| 항목 | 내용 |
|------|------|
| 현재 (v2.0) | Supabase (PostgreSQL) — 클라우드 관리형 DB |
| 인증 | Supabase Auth (auth.users 테이블 자동 관리) |
| 보안 | Row Level Security (RLS) — 사용자별 데이터 격리 |

---

## 2. 현재 스키마 — Supabase PostgreSQL

### 2-1. cards 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 카드 고유 ID |
| user_id | UUID | NOT NULL, FK → auth.users(id) | 카드 소유 사용자 |
| column_id | TEXT | NOT NULL | 소속 컬럼 ('todo' \| 'in-progress' \| 'done') |
| text | TEXT | NOT NULL | 카드 내용 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 |

### 2-2. DDL

```sql
CREATE TABLE cards (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  column_id  TEXT        NOT NULL,
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2-3. Row Level Security

```sql
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- 자신의 카드만 읽기/쓰기/수정/삭제 가능
CREATE POLICY "users_own_cards" ON cards
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 3. Supabase API 연동 (클라이언트 측)

Supabase JS SDK가 REST API를 자동 생성한다. `script.js`에서 사용하는 호출:

| 작업 | 코드 |
|------|------|
| 카드 목록 조회 | `supabaseClient.from('cards').select('*').order('created_at')` |
| 카드 생성 | `supabaseClient.from('cards').insert({ user_id, column_id, text })` |
| 카드 이동 (컬럼 변경) | `supabaseClient.from('cards').update({ column_id }).eq('id', cardId)` |
| 카드 삭제 | `supabaseClient.from('cards').delete().eq('id', cardId)` |

RLS가 활성화되어 있으므로 `user_id` 필터를 코드에서 별도로 지정하지 않아도 로그인한 사용자의 데이터만 반환된다.

---

## 4. 인증 테이블 (Supabase 자동 관리)

`auth.users` 테이블은 Supabase가 내부적으로 관리한다. 직접 접근하지 않으며, `auth.uid()` 함수로 현재 세션의 사용자 ID를 참조한다.

| 제공자 | 방식 |
|--------|------|
| 이메일/비밀번호 | Supabase Auth 기본 제공 |
| GitHub OAuth | Supabase Auth > Providers > GitHub 설정 |

---

## 5. Supabase 프로젝트 설정

| 항목 | 값 |
|------|---|
| Project URL | `https://zezbzjttxfmjzdzmmhte.supabase.co` |
| Site URL | `https://uyggnodkrap.github.io/kanban-board` |
| Redirect URLs | `https://uyggnodkrap.github.io/kanban-board`, `https://uyggnodkrap.github.io/kanban-board/` |
