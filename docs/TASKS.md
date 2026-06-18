# Tasks — 구현 태스크 체크리스트

## 1. 개요

칸반보드 v1.0 구현을 위한 태스크를 Phase별로 정의한다.
각 태스크는 독립적으로 완료 가능하도록 분리되어 있다.

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
- [x] `<header>` — 보드 제목 작성
- [x] `<main class="board">` 컨테이너 작성
- [x] Todo 컬럼 `<section>` 작성 (헤더 + `.cards` + `.add-form`)
- [x] In Progress 컬럼 `<section>` 작성
- [x] Done 컬럼 `<section>` 작성
- [x] 각 컬럼에 샘플 카드 2~3개 하드코딩 (JS `SAMPLE_CARDS` 로 초기화)
- [x] `<link rel="stylesheet" href="style.css">` 연결
- [x] `<script src="script.js" defer>` 연결

---

## 4. Phase 2: CSS 스타일 구현

- [x] `style.css` 파일 생성
- [x] `:root` — CSS 토큰 정의 (색상, 간격, 반경, 그림자, 폰트)
- [x] `body` — 기본 스타일, 폰트 패밀리 설정
- [x] `header` — 보드 제목 스타일
- [x] `.board` — Flexbox 3단 레이아웃
- [x] `.column` — 컬럼 기본 스타일 (배경, 패딩, 반경)
- [x] `.column.drag-over` — 드롭 대상 강조 스타일
- [x] `.column-header` — 헤더 Flexbox (제목 + 뱃지)
- [x] `.card-count` — 카드 수 뱃지
- [x] `.cards` — 카드 목록 컨테이너 (min-height 확보)
- [x] `.card` — 카드 기본 스타일 (배경, 그림자, 패딩)
- [x] `.card:hover` — hover 그림자 강화
- [x] `.card.dragging` — 드래그 중 투명도
- [x] `.delete-btn` — 삭제 버튼 스타일
- [x] `.delete-btn:hover` — 빨간색 hover
- [x] `.add-form` — 폼 Flexbox 레이아웃
- [x] `.add-form input` — 입력 필드 스타일 + focus 링
- [x] `.add-form button` — 추가 버튼 스타일 + hover
- [x] `@media (max-width: 767px)` — 모바일 세로 스택 (기본 대응)

---

## 5. Phase 3: JavaScript — 드래그앤드롭 구현

- [x] `script.js` 파일 생성
- [x] 모든 `.column` 요소에 `dragover` 이벤트 연결 (`e.preventDefault()`)
- [x] 모든 `.column` 요소에 `dragleave` 이벤트 연결 (`.drag-over` 해제)
- [x] 모든 `.column` 요소에 `drop` 이벤트 연결 (카드 이동 로직)
- [x] `dragover` 시 `.drag-over` 클래스 추가
- [x] `drop` 시 `dataTransfer.getData()`로 카드 ID 읽기
- [x] `drop` 시 카드를 대상 컬럼 `.cards`에 `appendChild`
- [x] `drop` 후 카드 수 뱃지 갱신
- [x] 샘플 카드에 `dragstart` 이벤트 연결 (`.dragging` 추가)
- [x] 샘플 카드에 `dragend` 이벤트 연결 (`.dragging` 제거)

---

## 6. Phase 4: JavaScript — 카드 CRUD 구현

- [x] `createCard(text)` 함수 구현 (카드 DOM 생성)
- [x] 카드 생성 시 고유 ID 부여 (`card-${Date.now()}` 또는 `crypto.randomUUID()`)
- [x] 새 카드에 `dragstart` / `dragend` 이벤트 바인딩
- [x] 새 카드에 삭제 버튼 `click` 이벤트 바인딩
- [x] 각 `.add-form`에 `submit` 이벤트 연결
- [x] 빈 텍스트 입력 시 카드 생성 차단
- [x] 카드 추가 후 입력 필드 초기화
- [x] 카드 추가 후 해당 컬럼 카드 수 뱃지 갱신
- [x] 삭제 버튼 클릭 시 `card.remove()` 실행
- [x] 삭제 후 해당 컬럼 카드 수 뱃지 갱신
- [x] `updateCardCount(columnEl)` 헬퍼 함수 구현

---

## 7. Phase 5: 초기화 및 마무리

- [x] 페이지 로드 시 샘플 카드를 JS로 초기화하는 방식으로 전환 (`SAMPLE_CARDS` + `initSampleCards`)
- [x] 모든 초기 카드에 드래그앤드롭 + 삭제 이벤트 자동 바인딩 확인
- [x] 컬럼 카드 수 뱃지 초기값 설정 (`addCardToColumn` 내 `updateCardCount` 호출)

---

## 8. Phase 6: 검증

- [x] `python3 -m http.server 3000` 실행 후 접속 (HTTP 200 확인)
- [ ] Todo → In Progress 카드 드래그 이동 확인
- [ ] In Progress → Done 카드 드래그 이동 확인
- [ ] Done → Todo 역방향 이동 확인
- [ ] 각 컬럼 카드 추가 확인
- [ ] 빈 텍스트 입력 시 차단 확인
- [ ] 카드 삭제 확인
- [ ] 카드 수 뱃지 갱신 확인
- [ ] 드래그 중 카드 투명도 확인
- [ ] 드롭 대상 컬럼 강조 확인
- [ ] Chrome / Firefox / Edge 각각에서 동작 확인

---

## 9. Phase 7: 향후 작업 (v1.1+)

- [ ] LocalStorage 영속성 구현
- [ ] 카드 텍스트 인라인 편집 기능
- [ ] 모바일 터치 드래그앤드롭 지원
- [ ] 카드 순서 정렬 (컬럼 내 위치 지정)
- [ ] REST API 연동을 위한 `api.js` 레이어 분리
