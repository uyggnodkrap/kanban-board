# User Flow

## 1. 개요

칸반보드 사용자의 주요 흐름을 정의한다. v3.0부터 팀 공유와 실시간 동기화가 추가됐다.

---

## 2. 전체 흐름도

```
[브라우저에서 URL 접속]
         │
    ┌────┴──────────────┐
    │ ?invite=xxx 있음?  │
    └────┬──────────────┘
    아니오│          예│
         │          ▼
         │   sessionStorage에 코드 저장
         │
         ▼
  [세션 확인 (Supabase)]
         │
    ┌────┴──────┐
    │           │
    ▼           ▼
[미로그인]   [로그인 상태]
    │           │
    ▼           ▼
[인증 패널]  [loadOrCreateBoard 또는 acceptInvite]
    │           │
  로그인 성공   ▼
    └──────► [initBoard → 보드 표시 + Realtime 구독]
                          │
            ┌─────────────┼──────────────┐
            ▼             ▼              ▼
       [카드 조작]   [팀원 초대]    [활동 로그 확인]
```

---

## 3. 시나리오별 상세 흐름

### Flow 1: 앱 진입 (미로그인)

```
사용자 → URL 접속
       → Supabase 세션 확인 (INITIAL_SESSION)
       → 세션 없음 → 인증 패널 표시 (로그인 뷰)
```

### Flow 2: 앱 진입 (로그인 상태)

```
사용자 → URL 접속
       → Supabase 세션 확인
       → 유효한 세션 있음
       → loadOrCreateBoard() 호출 → window.currentBoardId 설정
       → initBoard() 호출 → DB에서 카드 로드 + Realtime 구독
       → 카드가 없으면 샘플 카드 자동 삽입
       → 활동 로그 초기화 (최근 50개 로드)
```

---

### Flow 3: 이메일 회원가입

```
사용자 → [회원가입] 링크 클릭 → 회원가입 뷰 표시
       → 이메일 + 비밀번호 입력 → [회원가입] 버튼 클릭
       → Supabase signUp 호출
       → 이메일 인증 안내 뷰 표시
       → 이메일함에서 인증 링크 클릭
       → 앱 URL로 리다이렉트 → 자동 로그인 → 보드 표시
```

### Flow 4: 이메일 로그인

```
사용자 → 이메일 + 비밀번호 입력 → [로그인] 버튼 클릭
       → Supabase signInWithPassword 호출

  [인증 실패] → 에러 메시지 표시
  [인증 성공] → onAuthStateChange(SIGNED_IN)
             → window.currentUser 설정
             → loadOrCreateBoard() → initBoard()
             → 보드 표시
```

### Flow 5: GitHub OAuth 로그인

```
사용자 → [GitHub로 로그인] 버튼 클릭
       → signInWithOAuth({ provider: 'github', redirectTo: 현재URL })
       → GitHub 인증 페이지 → 권한 승인
       → 앱 URL로 리다이렉트
       → onAuthStateChange(SIGNED_IN) → 보드 표시
```

---

### Flow 6: 카드 추가

```
사용자 → 컬럼 하단 입력 필드 클릭
       → 텍스트 입력 → [추가] 클릭 또는 Enter

  [빈 텍스트] → 카드 생성 차단
  [텍스트 있음]
       → Supabase insert({ board_id, column_id, text })
       → DOM에 카드 추가
       → 컬럼 카드 수 갱신
       → logActivity('card_added') 기록
       → [Realtime] 같은 보드 멤버 화면에 즉시 반영
```

### Flow 7: 카드 드래그앤드롭 이동

```
사용자 → 카드 드래그 시작 (dragstart)
       → 카드 투명도 감소, 대상 컬럼 강조

  [다른 컬럼에 드롭]
       → Supabase update({ column_id }) 호출
       → DOM 이동 + 카드 수 갱신
       → logActivity('card_moved') 기록
       → [Realtime] 같은 보드 멤버 화면에 즉시 반영
```

### Flow 8: 카드 삭제

```
사용자 → 카드의 × 버튼 클릭
       → Supabase delete().eq('id', cardId)
       → 카드 DOM 제거 + 카드 수 갱신
       → logActivity('card_deleted') 기록
       → [Realtime] 같은 보드 멤버 화면에서 카드 제거
```

### Flow 9: 로그아웃

```
사용자 → 헤더의 [로그아웃] 버튼 클릭
       → Supabase signOut()
       → onAuthStateChange(SIGNED_OUT)
       → window.currentUser, window.currentBoardId 초기화
       → 보드 숨김 → 인증 패널 표시
```

---

### Flow 10: 팀원 초대 (오너)

```
오너 → 헤더의 [팀원 초대] 버튼 클릭
     → board_invites INSERT (code 자동 생성, 7일 유효)
     → 초대 URL 클립보드 자동 복사
     → "초대 링크가 클립보드에 복사되었습니다!" 토스트 표시
     → 오너가 팀원에게 링크 전달
```

### Flow 11: 초대 링크로 보드 합류 (신규 멤버)

```
팀원 → 초대 링크 클릭 (URL에 ?invite=코드 포함)
     → sessionStorage에 코드 저장

  [미로그인 상태]
     → 인증 패널 표시
     → 로그인/회원가입 완료
     → onAuthStateChange(SIGNED_IN)
     → acceptInvite(user, code) 호출

  [이미 로그인 상태]
     → acceptInvite(user, code) 즉시 호출

  acceptInvite 흐름:
     → board_invites에서 코드 조회
     → 만료 확인 (expires_at < NOW() → 에러 토스트)
     → 이미 멤버/오너인지 확인
     → 신규 멤버: board_members INSERT
     → activity_log에 'member_joined' 기록
     → window.currentBoardId = 초대받은 보드 ID
     → URL에서 ?invite= 파라미터 제거 (history.replaceState)
     → initBoard() → 오너의 보드 카드 표시
     → "보드에 합류했습니다!" 토스트 표시
```

### Flow 12: 실시간 동기화

```
팀원 A가 카드 추가/이동/삭제
       → Supabase DB 변경
       → Realtime PostgresChange 이벤트 발생
       → 같은 board_id를 구독 중인 팀원 B의 채널에 전달
       → handleCardChange() 호출 → 팀원 B의 DOM 즉시 업데이트
       → activity_log INSERT → renderActivityEntry() → 양쪽 로그 패널 갱신
```

---

## 4. 엣지 케이스

| 케이스 | 처리 방법 |
|--------|---------|
| 빈 텍스트로 카드 추가 시도 | 카드 생성 차단, 입력 포커스 유지 |
| 만료된 초대 링크 접근 | 에러 토스트 표시, 본인 보드로 이동 |
| 중복 초대 링크 접근 | 이미 멤버면 스킵, 해당 보드로 이동 |
| 초대 오너 본인이 링크 접근 | 본인 보드이므로 스킵, 정상 진입 |
| DB 요청 실패 | 콘솔 에러 (활동 로그 기록 실패 시 메인 동작 차단 안 함) |
| Realtime 연결 끊김 | 페이지 새로고침으로 최신 상태 로드 |
| 클립보드 API 미지원 | 링크 텍스트를 토스트에 직접 표시 |

---

## 5. 화면 상태 요약

```
[인증 패널]
  ├─ view-signin  (기본)
  ├─ view-signup
  └─ view-verify

[보드]
  └─ board-wrapper (로그인 후)
       ├─ header (이메일 + 팀원초대 + 로그아웃)
       ├─ #board-area
       │    ├─ .board
       │    │    ├─ #todo
       │    │    ├─ #in-progress
       │    │    └─ #done
       │    └─ #activity-panel (활동 로그)
       └─ #toast
```

상태 전환은 DOM의 `hidden` 클래스 토글로만 처리한다. 페이지 이동 없음.
