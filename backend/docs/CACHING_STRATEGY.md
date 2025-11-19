# 클라이언트 캐싱 전략 및 화면 상태 관리

이 문서는 코디 추천 및 목록 조회 기능에서 사용되는 클라이언트 측 캐싱 전략과 화면 상태 관리 방식을 설명합니다.

## 목차

1. [개요](#개요)
2. [데이터 로드 흐름](#데이터-로드-흐름)
3. [로컬 스토리지 캐싱](#로컬-스토리지-캐싱)
4. [화면 재진입 처리](#화면-재진입-처리)
5. [무한 스크롤 구현](#무한-스크롤-구현)
6. [데이터 관리 전략](#데이터-관리-전략)

---

## 개요

### 목적

- 사용자가 화면을 나갔다가 다시 들어올 때 이전 상태를 복원
- 이미 본 코디를 추천에서 제외하여 사용자 경험 개선
- 네트워크 요청 최소화 및 빠른 화면 복원

### 기술 스택

- **클라이언트 캐싱**: LocalStorage
- **상태 관리**: 클라이언트 측 상태 추적
- **백엔드 API**: `POST /api/outfits/skip` (본 코디 기록)

---

## 데이터 로드 흐름

### 1. 초기 로드 (Recommendation)

```
사용자 로그인/웹 접속
  ↓
GET /api/recommendations?page=1&limit=20
  ↓
추천 코디 20개 반환 [A, B, C, ..., T]
  ↓
클라이언트 상태:
  - allItems = [A, B, C, ..., T]  // 20개
  - currentPage = 1
  - dataSource = "recommendation"
  - viewedItemIds = []  // 아직 본 코디 없음
```

### 2. 사용자 스크롤/스와이프

```
사용자가 코디를 스크롤/스와이프
  ↓
본 코디 ID를 viewedItemIds에 추가
  ↓
주기적으로 로컬 스토리지 업데이트 (예: 1초마다)
  ↓
로컬 스토리지:
  {
    items: [A, B, C, ..., T],
    viewedItemIds: [A.id, B.id, C.id, ...],
    currentPage: 1,
    dataSource: "recommendation",
    scrollPosition: 1200,
    timestamp: "2025-01-20T10:00:15Z"
  }
```

### 3. Prefetch (Outfit)

```
스크롤이 맨 아래 도달 (hasNext === true)
  ↓
GET /api/outfits?page=2&limit=20
  ↓
일반 코디 20개 반환 [U, V, W, ..., ...]
  ↓
클라이언트 상태:
  - allItems = [A, B, C, ..., T, U, V, W, ..., ...]  // 40개 (추가)
  - currentPage = 2
  - dataSource = "outfit"  // 이제 outfit 단계
  - viewedItemIds = [A.id, B.id, C.id, ..., R.id]
  ↓
로컬 스토리지 업데이트
```

**중요**: recommendation 데이터는 유지하고 outfit 데이터를 뒤에 추가합니다 (교체하지 않음).

---

## 로컬 스토리지 캐싱

### 저장 구조

```json
{
  "items": [
    // recommendation 데이터 (A~T)
    {"id": 1, "imageUrl": "...", "llmMessage": "..."},
    {"id": 2, "imageUrl": "...", "llmMessage": "..."},
    ...
    // outfit 데이터 (U~...)
    {"id": 21, "imageUrl": "...", "llmMessage": null},
    {"id": 22, "imageUrl": "...", "llmMessage": null},
    ...
  ],
  "viewedItemIds": [1, 2, 3, ..., 25],  // 실제로 본 코디 ID 리스트
  "currentPage": 2,
  "dataSource": "outfit",  // "recommendation" 또는 "outfit"
  "scrollPosition": 2400,
  "lastViewedItemId": 25,
  "filters": {},  // 필터 정보 (선택적)
  "timestamp": "2025-01-20T10:00:30Z"
}
```

### 저장 시점

1. **주기적 저장**: 사용자가 스크롤/스와이프할 때마다 (debounce 적용, 예: 1초마다)
2. **화면 이탈 시**: `beforeunload` 이벤트 또는 컴포넌트 언마운트 시 최종 상태 저장

### 캐시 유효성

- **유효 기간**: 1시간 (선택적)
- **무효 조건**: 
  - 캐시가 1시간 이상 지난 경우
  - 데이터 구조가 변경된 경우

---

## 화면 재진입 처리

### 처리 흐름

```
1. 화면 진입
   ↓
2. 로컬 스토리지 확인
   ↓
3. 캐시 있음?
   ├─ YES
   │   ├─ 3-1. viewedItemIds 추출
   │   ├─ 3-2. POST /api/outfits/skip
   │   │      → 백엔드에 본 코디 기록 (action_type="skip")
   │   ├─ 3-3. 로컬 스토리지 삭제
   │   └─ 3-4. GET /api/recommendations?page=1
   │         → 이미 본 코디는 자동 제외됨
   │         → 새로운 추천 반환
   └─ NO
       → GET /api/recommendations?page=1
         → 새로 로드
```

### 상세 구현

#### 1. 본 코디 기록 (SKIP 요청)

```javascript
// 로컬 스토리지에서 viewedItemIds 추출
const cachedData = localStorage.getItem('outfits_cache');
const state = JSON.parse(cachedData);
const viewedItemIds = state.viewedItemIds;  // [1, 2, 3, ..., 25]

// 백엔드에 SKIP 요청
await fetch('/api/outfits/skip', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    outfitIds: viewedItemIds
  })
});
```

**백엔드 처리**:
- `UserCoordiInteraction` 테이블에 `action_type="skip"`으로 기록
- 이미 `action_type="like"`로 기록된 코디는 변경하지 않음 (좋아요 우선)
- 이후 `/api/recommendations` 또는 `/api/outfits` 호출 시 자동으로 제외됨

#### 2. 로컬 스토리지 삭제

```javascript
// 로컬 스토리지 삭제
localStorage.removeItem('outfits_cache');
```

#### 3. 새로운 추천 요청

```javascript
// 새로운 추천 요청 (이미 본 코디는 자동 제외됨)
const response = await fetch('/api/recommendations?page=1&limit=20');
const data = await response.json();

// 새로운 데이터 표시
allItems = data.data.outfits;
displayItems(allItems);

// 로컬 스토리지 초기화
saveStateToLocalStorage({
  items: allItems,
  viewedItemIds: [],
  currentPage: 1,
  dataSource: "recommendation"
});
```

---

## 무한 스크롤 구현

### 구현 방식

**스크롤 맨 아래 도달 시 다음 페이지 로드**

```javascript
// 스크롤 이벤트 리스너
window.addEventListener('scroll', () => {
  // 스크롤이 맨 아래에 도달했는지 확인
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    loadNextPage();
  }
});

async function loadNextPage() {
  // 이미 로딩 중이면 무시
  if (isLoading) return;
  
  // pagination.hasNext 확인
  if (!lastResponse.data.pagination.hasNext) {
    return; // 모든 아이템 로드 완료
  }
  
  isLoading = true;
  showLoadingSpinner(); // 로딩 스피너 표시
  
  try {
    // recommendation 단계면 outfit API 사용
    if (dataSource === "recommendation") {
      const response = await fetch(`/api/outfits?page=${currentPage + 1}&limit=20`);
      const data = await response.json();
      
      // 기존 데이터에 추가 (교체하지 않음)
      allItems = [...allItems, ...data.data.outfits];
      dataSource = "outfit"; // 이제 outfit 단계
    } else {
      // 이미 outfit 단계면 계속 outfit API 사용
      const response = await fetch(`/api/outfits?page=${currentPage + 1}&limit=20`);
      const data = await response.json();
      
      allItems = [...allItems, ...data.data.outfits];
    }
    
    currentPage++;
    displayItems(allItems);
    
    // pagination 정보 업데이트
    lastResponse = data;
  } finally {
    isLoading = false;
    hideLoadingSpinner();
  }
}
```

### hasNext 동작 방식

**백엔드 계산 로직**:
```python
total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0
has_next = page < total_pages
```

**예시**:
- `total_items = 95`, `limit = 20`, `page = 1`
  - `total_pages = 5`
  - `has_next = 1 < 5 = True` ✅
- `total_items = 95`, `limit = 20`, `page = 5`
  - `total_pages = 5`
  - `has_next = 5 < 5 = False` ❌

---

## 데이터 관리 전략

### 1. 데이터 추가 방식 (교체하지 않음)

**원칙**: recommendation 데이터는 유지하고 outfit 데이터를 뒤에 추가

```javascript
// ✅ 올바른 방식
allItems = [...allItems, ...newOutfitItems];  // 추가

// ❌ 잘못된 방식
allItems = newOutfitItems;  // 교체 (사용자가 보던 코디가 사라짐)
```

**이유**:
- 사용자가 보던 코디가 사라지지 않음
- 자연스러운 무한 스크롤 경험
- 스크롤 위치 유지

### 2. 본 코디 추적

**원칙**: 실제로 본 코디 ID만 추적

```javascript
// 사용자가 코디를 볼 때마다
function onOutfitViewed(outfitId) {
  if (!viewedItemIds.includes(outfitId)) {
    viewedItemIds.push(outfitId);
    
    // 로컬 스토리지 업데이트 (debounce 적용)
    debouncedSaveState();
  }
}
```

**저장 대상**:
- ✅ 실제로 본 코디 ID만 저장
- ❌ 로드만 된 코디는 저장하지 않음

### 3. 화면 재진입 시 처리

**원칙**: 캐시 삭제 + 백엔드 기록 + 새로 로드

1. 로컬 스토리지에서 `viewedItemIds` 추출
2. `POST /api/outfits/skip`으로 백엔드에 기록
3. 로컬 스토리지 삭제
4. 새로운 추천 요청 (이미 본 코디는 자동 제외)

**이유**:
- 백엔드에 본 코디를 기록하여 다음 추천에서 제외
- 로컬 캐시는 삭제하여 최신 데이터 보장
- 사용자가 같은 코디를 다시 보지 않도록 함

---

## 주요 고려사항

### 1. 좋아요 우선 원칙

- 이미 `action_type="like"`로 기록된 코디는 `action_type="skip"`으로 변경되지 않음
- 좋아요가 우선순위가 높음

### 2. 중복 기록 방지

- Primary Key 제약 (`user_id`, `coordi_id`)으로 중복 방지
- 이미 skip으로 기록된 코디는 `skippedCount`에 포함

### 3. 배치 처리

- 여러 코디를 한 번에 기록 (`POST /api/outfits/skip`)
- 네트워크 요청 최소화

### 4. 성능 최적화

- 로컬 스토리지 저장 시 debounce 적용
- 스크롤 이벤트 throttle 적용
- 로딩 스피너로 사용자 경험 개선

---

## 참고 자료

- [API 명세서: POST /api/outfits/skip](./API_TEST.md)
- [추천 API: GET /api/recommendations](./API_TEST.md)
- [목록 조회 API: GET /api/outfits](./API_TEST.md)

---

## 향후 개선 사항

1. **캐시 무효화 전략**: 서버에서 캐시 버전 관리
2. **부분 업데이트**: 변경된 코디만 업데이트
3. **오프라인 지원**: Service Worker를 통한 오프라인 캐싱
4. **캐시 압축**: 대용량 데이터 압축 저장

