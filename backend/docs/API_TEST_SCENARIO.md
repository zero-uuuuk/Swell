## 순차적 테스트 시나리오

이 섹션은 실제 사용자 플로우를 기반으로 한 순차적인 테스트 시나리오를 제공합니다. 각 단계에서 무엇을 검증해야 하는지 상세히 명시되어 있습니다.

---

### 시나리오 1: 신규 사용자 온보딩 플로우

**목적:** 신규 사용자가 회원가입부터 온보딩 완료까지의 전체 플로우를 검증합니다.

**전제 조건:**
- 데이터베이스가 초기화된 상태
- 서버가 정상적으로 실행 중

**단계별 테스트:**

#### 1단계: 회원가입

**API 호출:**
- `POST {{api_base}}/auth/signup`
- Body:
  ```json
  {
    "email": "newuser@example.com",
    "password": "password123",
    "name": "홍길동",
    "gender": "male"
  }
  ```

**검증 항목:**
- [ ] HTTP 상태 코드: `201 Created`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.user.id`: 숫자 (사용자 ID)
  - `data.user.email`: `"newuser@example.com"`
  - `data.user.name`: `"홍길동"`
  - `data.user.gender`: `"male"`
  - `data.user.profileImageUrl`: `null` (초기값)
  - `data.user.preferredTags`: `null` (초기값)
  - `data.user.preferredCoordis`: `null` (초기값)
  - `data.user.hasCompletedOnboarding`: `false` (온보딩 미완료)
  - `data.user.createdAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 사용자 ID를 메모해두세요 (예: `userId = 1`)
- 이 단계에서는 토큰이 반환되지 않으므로 로그인이 필요합니다

---

#### 2단계: 로그인

**API 호출:**
- `POST {{api_base}}/auth/login`
- Body:
  ```json
  {
    "email": "newuser@example.com",
    "password": "password123"
  }
  ```

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.user.id`: 1단계에서 확인한 사용자 ID와 동일
  - `data.user.email`: `"newuser@example.com"`
  - `data.user.hasCompletedOnboarding`: `false` (아직 온보딩 미완료)
  - `data.token`: JWT 토큰 문자열 (길이가 100자 이상)
- [ ] Postman 환경 변수 `{{token}}`에 토큰 저장 확인

**다음 단계로 넘어가기 전:**
- 토큰이 정상적으로 저장되었는지 확인
- 이후 모든 API 호출에서 `Authorization: Bearer {{token}}` 헤더 사용

---

#### 3단계: 내 정보 조회 (온보딩 전 초기 상태)

**API 호출:**
- `GET {{api_base}}/auth/me`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.user.id`: 이전 단계와 동일한 사용자 ID
  - `data.user.profileImageUrl`: `null` (아직 프로필 사진 없음)
  - `data.user.preferredTags`: `null` 또는 빈 배열 (선호 태그 미설정)
  - `data.user.preferredCoordis`: `null` 또는 빈 배열 (선호 코디 미설정)
  - `data.user.hasCompletedOnboarding`: `false` (온보딩 미완료)

**다음 단계로 넘어가기 전:**
- 프로필 사진과 선호도가 모두 비어있는 상태임을 확인

---

#### 4단계: 선호도 설정 옵션 조회

**API 호출:**
- `GET {{api_base}}/users/preferences/options`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.hashtags`: 배열 (최소 3개 이상)
    - 각 해시태그는 `id` (숫자), `name` (문자열, 예: "#캐주얼") 포함
  - `data.sampleOutfits`: 배열 (최소 5개 이상)
    - 각 코디는 `id` (숫자), `imageUrl` (문자열), `style` (문자열), `season` (문자열) 포함
- [ ] 해시태그 ID 목록 메모 (예: [1, 2, 3])
- [ ] 샘플 코디 ID 목록 메모 (정확히 5개, 예: [1438474944176932480, 1438291847265123456, ...])

**다음 단계로 넘어가기 전:**
- 선호도 설정에 필요한 옵션들을 확인
- 해시태그는 최소 3개, 최대 10개 선택 가능
- 샘플 코디는 정확히 5개 선택 필요

---

#### 5단계: 선호도 설정

**API 호출:**
- `POST {{api_base}}/users/preferences`
- Headers: `Authorization: Bearer {{token}}`
- Body:
  ```json
  {
    "hashtagIds": [1, 2, 3],
    "sampleOutfitIds": [1438474944176932480, 1438291847265123456, 1438108750352345678, 1437925653440567890, 1437742556523789012]
  }
  ```
  > **참고:** 4단계에서 조회한 실제 ID 값을 사용하세요

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.message`: `"선호도가 저장되었습니다"`
  - `data.user.hasCompletedOnboarding`: `true` (온보딩 완료로 변경됨)

**다음 단계로 넘어가기 전:**
- 온보딩 상태가 `false`에서 `true`로 변경되었는지 확인

---

#### 6단계: 내 정보 재조회 (선호도 설정 후)

**API 호출:**
- `GET {{api_base}}/auth/me`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.user.hasCompletedOnboarding`: `true` (이전 `false`에서 변경됨)
  - `data.user.preferredTags`: 배열 (3개 태그)
    - 각 태그는 `id`와 `name` 포함
    - 5단계에서 선택한 해시태그 ID와 일치하는지 확인
  - `data.user.preferredCoordis`: 배열 (5개 코디)
    - 각 코디는 `id`, `style`, `season`, `gender`, `description`, `mainImageUrl`, `preferredAt` 포함
    - 5단계에서 선택한 코디 ID와 일치하는지 확인
  - `data.user.profileImageUrl`: 여전히 `null` (프로필 사진은 아직 없음)

**다음 단계로 넘어가기 전:**
- 선호 태그와 선호 코디가 정상적으로 저장되었는지 확인
- 온보딩이 완료되었지만 프로필 사진은 아직 없는 상태

---

#### 7단계: 프로필 사진 업로드

**API 호출:**
- `POST {{api_base}}/users/profile-photo`
- Headers: `Authorization: Bearer {{token}}`
- Body: `form-data`
  - Key: `photo` (File 타입)
  - Value: JPG 또는 PNG 파일 선택 (10MB 이하)

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.photoUrl`: 문자열 (예: `/uploads/users/1/profile_xxx.jpg`)
    - 경로가 `/uploads/users/{userId}/profile_`로 시작하는지 확인
  - `data.createdAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 프로필 사진 URL을 메모해두세요
- 파일이 정상적으로 업로드되었는지 확인

---

#### 8단계: 내 정보 최종 조회 (프로필 사진 포함)

**API 호출:**
- `GET {{api_base}}/auth/me`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.user.profileImageUrl`: `null`이 아님
    - 7단계에서 반환된 `photoUrl`과 일치하는지 확인
    - 경로 형식: `/uploads/users/{userId}/profile_xxx.jpg`
  - `data.user.preferredTags`: 이전과 동일하게 유지 (3개 태그)
  - `data.user.preferredCoordis`: 이전과 동일하게 유지 (5개 코디)
  - `data.user.hasCompletedOnboarding`: `true` (여전히 완료 상태)

**최종 확인:**
- [ ] 프로필 사진이 정상적으로 반환됨
- [ ] 선호도 정보가 유지됨
- [ ] 온보딩이 완료된 상태
- [ ] 모든 사용자 정보가 정상적으로 표시됨

---

### 시나리오 2: 추천 코디 탐색 및 상호작용 플로우

**목적:** 개인화 추천 코디를 조회하고, 조회 로그를 기록하며, 좋아요를 추가하는 플로우를 검증합니다.

**전제 조건:**
- 시나리오 1을 완료한 사용자 (온보딩 완료, 선호도 설정됨)
- 유효한 JWT 토큰 (`{{token}}`)
- 데이터베이스에 사용자 성별에 맞는 코디가 존재

**단계별 테스트:**

#### 1단계: 개인화 추천 코디 조회

**API 호출:**
- `GET {{api_base}}/recommendations?page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열 (최소 1개 이상)
    - 각 코디 확인:
      - `id`: 숫자 (코디 ID)
      - `imageUrl`: 문자열 (이미지 경로)
      - `gender`: 사용자 성별과 일치
      - `season`: 문자열 ("spring", "summer", "fall", "winter" 중 하나)
      - `style`: 문자열 ("casual", "street", "sporty", "minimal" 중 하나)
      - `description`: 문자열
      - `isFavorited`: `false` (아직 좋아요하지 않음)
      - `llmMessage`: 문자열 또는 `null` (개인화 메시지)
      - `items`: 배열 (아이템 목록)
        - 각 아이템: `id`, `category`, `brand`, `name`, `price`, `imageUrl`, `purchaseUrl`, `isSaved` 포함
      - `createdAt`: ISO 8601 형식 날짜
  - `data.pagination`:
    - `currentPage`: `1`
    - `totalPages`: `1` 이상
    - `totalItems`: `0` 이상
    - `hasNext`: boolean
    - `hasPrev`: `false` (첫 페이지)
- [ ] 첫 번째 코디의 ID를 메모 (예: `outfitId = 134314134113`)

**다음 단계로 넘어가기 전:**
- 추천된 코디가 사용자 성별에 맞는지 확인
- 코디 ID를 다음 단계에서 사용하기 위해 메모

---

#### 2단계: 코디 조회 로그 기록

**API 호출:**
- `POST {{api_base}}/outfits/{outfitId}/view`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `outfitId` (1단계에서 메모한 코디 ID)
- Body:
  ```json
  {
    "durationSeconds": 5
  }
  ```

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.message`: `"조회 로그가 기록되었습니다"`
  - `data.recordedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 조회 로그가 정상적으로 기록되었는지 확인

---

#### 3단계: 코디 좋아요 추가

**API 호출:**
- `POST {{api_base}}/outfits/{outfitId}/favorite`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `outfitId` (1단계에서 메모한 코디 ID)

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfitId`: 1단계에서 사용한 코디 ID와 일치
  - `data.isFavorited`: `true`
  - `data.favoritedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 좋아요가 정상적으로 추가되었는지 확인

---

#### 4단계: 추천 코디 재조회 (좋아요 상태 확인)

**API 호출:**
- `GET {{api_base}}/recommendations?page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열
    - 좋아요한 코디 찾기 (3단계에서 사용한 `outfitId`)
    - 해당 코디의 `isFavorited`: `true` (이전 `false`에서 변경됨)
    - 또는 좋아요한 코디가 목록에서 제외되었을 수 있음 (추천 알고리즘에 따라)

**다음 단계로 넘어가기 전:**
- 좋아요 상태가 반영되었는지 확인

---

#### 5단계: 좋아요한 코디 목록 조회

**API 호출:**
- `GET {{api_base}}/outfits/favorites?page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열 (최소 1개)
    - 3단계에서 좋아요한 코디가 포함되어 있는지 확인
    - 각 코디 확인:
      - `id`: 숫자
      - `isFavorited`: 모든 코디가 `true`인지 확인
      - `llmMessage`: `null` (좋아요 목록에는 LLM 메시지 없음)
      - `items`: 배열 (아이템 정보 포함)
  - `data.pagination`:
    - `currentPage`: `1`
    - `totalItems`: `1` 이상
    - 좋아요한 코디가 정확히 1개면:
      - `totalPages`: `1`
      - `hasNext`: `false`
      - `hasPrev`: `false`
- [ ] 좋아요 추가 일시 기준 최신순으로 정렬되는지 확인
  - 첫 번째 코디가 3단계에서 추가한 코디인지 확인

**최종 확인:**
- [ ] 좋아요한 코디가 목록에 정상적으로 표시됨
- [ ] 모든 코디의 `isFavorited`가 `true`임
- [ ] 좋아요 추가 일시 기준 최신순으로 정렬됨

---

### 시나리오 3: 코디 필터링 및 탐색 플로우

**목적:** 코디 목록을 필터링하고, 여러 코디에 상호작용(좋아요/스킵)을 수행하며, 좋아요 취소하는 플로우를 검증합니다.

**전제 조건:**
- 시나리오 1을 완료한 사용자 (온보딩 완료)
- 유효한 JWT 토큰 (`{{token}}`)
- 데이터베이스에 다양한 코디가 존재

**단계별 테스트:**

#### 1단계: 코디 목록 조회 (전체)

**API 호출:**
- `GET {{api_base}}/outfits?season=all&style=all&gender=all&page=1&limit=10`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열 (최소 3개 이상 권장)
    - 각 코디의 `id`, `imageUrl`, `gender`, `season`, `style`, `description` 확인
    - `isFavorited`: `false` (아직 좋아요하지 않음)
  - `data.pagination`:
    - `currentPage`: `1`
    - `totalItems`: `0` 이상
- [ ] 최소 3개의 코디 ID를 메모 (예: `outfitId1`, `outfitId2`, `outfitId3`)

**다음 단계로 넘어가기 전:**
- 여러 코디 ID를 다음 단계에서 사용하기 위해 메모

---

#### 2단계: 코디 필터링 (season)

**API 호출:**
- `GET {{api_base}}/outfits?season=summer&style=all&gender=all&page=1&limit=10`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열
    - 모든 코디의 `season`이 `"summer"`인지 확인
    - 다른 계절의 코디가 포함되지 않았는지 확인
  - `data.pagination`:
    - `totalItems`: 전체 조회(1단계)보다 적거나 같음

**다음 단계로 넘어가기 전:**
- 필터링이 정상적으로 작동하는지 확인

---

#### 3단계: 코디 필터링 (style)

**API 호출:**
- `GET {{api_base}}/outfits?season=all&style=casual&gender=all&page=1&limit=10`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열
    - 모든 코디의 `style`이 `"casual"`인지 확인
    - 다른 스타일의 코디가 포함되지 않았는지 확인

**다음 단계로 넘어가기 전:**
- 스타일 필터링이 정상적으로 작동하는지 확인

---

#### 4단계: 복합 필터링

**API 호출:**
- `GET {{api_base}}/outfits?season=summer&style=casual&gender=male&page=1&limit=10`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열
    - 모든 코디가 다음 조건을 모두 만족하는지 확인:
      - `season`: `"summer"`
      - `style`: `"casual"`
      - `gender`: `"male"` (또는 사용자 성별)
  - `data.pagination`:
    - `totalItems`: 이전 단계들보다 적거나 같음 (필터가 더 많으므로)

**다음 단계로 넘어가기 전:**
- 복합 필터링이 정상적으로 작동하는지 확인
- 필터링된 코디 중 2개의 ID를 메모 (좋아요/스킵 테스트용)

---

#### 5단계: 첫 번째 코디 좋아요 추가

**API 호출:**
- `POST {{api_base}}/outfits/{outfitId1}/favorite`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `outfitId1` (1단계에서 메모한 첫 번째 코디 ID)

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfitId`: 사용한 코디 ID와 일치
  - `data.isFavorited`: `true`
  - `data.favoritedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 좋아요가 정상적으로 추가되었는지 확인

---

#### 6단계: 두 번째 코디 스킵 기록

**API 호출:**
- `POST {{api_base}}/outfits/{outfitId2}/skip`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `outfitId2` (1단계에서 메모한 두 번째 코디 ID)

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfitId`: 사용한 코디 ID와 일치
  - `data.isSkipped`: `true`
  - `data.skippedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 스킵이 정상적으로 기록되었는지 확인

---

#### 7단계: 세 번째 코디 조회 로그 기록

**API 호출:**
- `POST {{api_base}}/outfits/{outfitId3}/view`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `outfitId3` (1단계에서 메모한 세 번째 코디 ID)
- Body:
  ```json
  {
    "durationSeconds": 10
  }
  ```

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.message`: `"조회 로그가 기록되었습니다"`
  - `data.recordedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 조회 로그가 정상적으로 기록되었는지 확인

---

#### 8단계: 좋아요한 코디 목록 조회 (여러 개)

**API 호출:**
- `GET {{api_base}}/outfits/favorites?page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열
    - 5단계에서 좋아요한 코디가 포함되어 있는지 확인
    - 6단계에서 스킵한 코디는 포함되지 않았는지 확인
    - 7단계에서 조회 로그만 기록한 코디는 포함되지 않았는지 확인
    - 모든 코디의 `isFavorited`: `true`
  - `data.pagination`:
    - `totalItems`: 이전에 좋아요한 코디 수와 일치하는지 확인
- [ ] 좋아요 추가 일시 기준 최신순으로 정렬되는지 확인
  - 5단계에서 추가한 코디가 첫 번째로 나타나는지 확인

**다음 단계로 넘어가기 전:**
- 좋아요 목록이 정상적으로 표시되는지 확인
- 스킵/조회 로그만 기록한 코디는 목록에 없는지 확인

---

#### 9단계: 좋아요 취소

**API 호출:**
- `DELETE {{api_base}}/outfits/{outfitId1}/favorite`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `outfitId1` (5단계에서 좋아요한 코디 ID)

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfitId`: 사용한 코디 ID와 일치
  - `data.isFavorited`: `false`
  - `data.unfavoritedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 좋아요가 정상적으로 취소되었는지 확인

---

#### 10단계: 좋아요한 코디 목록 재조회 (취소 확인)

**API 호출:**
- `GET {{api_base}}/outfits/favorites?page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits`: 배열
    - 9단계에서 좋아요를 취소한 코디가 목록에서 제외되었는지 확인
    - 이전에 좋아요한 다른 코디들은 여전히 목록에 있는지 확인
  - `data.pagination`:
    - `totalItems`: 8단계보다 1 감소했는지 확인

**최종 확인:**
- [ ] 좋아요 취소가 정상적으로 반영됨
- [ ] 좋아요 목록에서 해당 코디가 제외됨
- [ ] 다른 좋아요한 코디는 유지됨

---

### 시나리오 4: 옷장 관리 플로우

**목적:** 옷장에 아이템을 저장하고, 목록을 조회하며, 카테고리별로 필터링하고, 삭제하는 플로우를 검증합니다.

**전제 조건:**
- 시나리오 1을 완료한 사용자 (온보딩 완료)
- 유효한 JWT 토큰 (`{{token}}`)
- 데이터베이스에 아이템이 존재 (코디 조회 시 `items` 배열에서 확인 가능)

**단계별 테스트:**

#### 1단계: 추천 코디에서 아이템 정보 확인

**API 호출:**
- `GET {{api_base}}/recommendations?page=1&limit=1`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits[0].items`: 배열 (최소 1개 이상)
    - 각 아이템의 `id`, `category`, `brand`, `name`, `imageUrl` 확인
- [ ] 옷장에 저장할 아이템 ID를 메모
  - 최소 3개의 아이템 (서로 다른 카테고리, 예: top, bottom, outer)
  - 예: `itemId1` (top), `itemId2` (bottom), `itemId3` (outer)

**다음 단계로 넘어가기 전:**
- 다양한 카테고리의 아이템 ID를 확인

---

#### 2단계: 첫 번째 아이템 저장 (top)

**API 호출:**
- `POST {{api_base}}/closet/items`
- Headers: `Authorization: Bearer {{token}}`
- Body:
  ```json
  {
    "itemId": 5562350
  }
  ```
  > **참고:** 1단계에서 확인한 실제 아이템 ID 사용

**검증 항목:**
- [ ] HTTP 상태 코드: `201 Created`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.message`: `"옷장에 저장되었습니다"`
  - `data.savedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 아이템이 정상적으로 저장되었는지 확인

---

#### 3단계: 두 번째 아이템 저장 (bottom)

**API 호출:**
- `POST {{api_base}}/closet/items`
- Headers: `Authorization: Bearer {{token}}`
- Body:
  ```json
  {
    "itemId": 5195037
  }
  ```
  > **참고:** 1단계에서 확인한 두 번째 아이템 ID 사용

**검증 항목:**
- [ ] HTTP 상태 코드: `201 Created`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.message`: `"옷장에 저장되었습니다"`
  - `data.savedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 아이템이 정상적으로 저장되었는지 확인

---

#### 4단계: 세 번째 아이템 저장 (outer)

**API 호출:**
- `POST {{api_base}}/closet/items`
- Headers: `Authorization: Bearer {{token}}`
- Body:
  ```json
  {
    "itemId": 1234567
  }
  ```
  > **참고:** 1단계에서 확인한 세 번째 아이템 ID 사용

**검증 항목:**
- [ ] HTTP 상태 코드: `201 Created`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.message`: `"옷장에 저장되었습니다"`
  - `data.savedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 3개의 아이템이 모두 저장되었는지 확인

---

#### 5단계: 옷장 아이템 목록 조회 (전체)

**API 호출:**
- `GET {{api_base}}/closet?category=all&page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.items`: 배열 (최소 3개)
    - 2, 3, 4단계에서 저장한 아이템이 모두 포함되어 있는지 확인
    - 각 아이템 확인:
      - `id`: 저장한 아이템 ID와 일치
      - `category`: "top", "bottom", "outer" 중 하나
      - `brand`: 문자열
      - `name`: 문자열
      - `price`: 숫자
      - `imageUrl`: 문자열
      - `purchaseUrl`: 문자열
      - `savedAt`: ISO 8601 형식의 날짜 문자열
    - 저장 일시 기준 최신순으로 정렬되는지 확인
      - 가장 최근에 저장한 아이템(4단계)이 첫 번째로 나타나는지 확인
  - `data.pagination`:
    - `currentPage`: `1`
    - `totalItems`: `3` 이상
  - `data.categoryCounts`:
    - `top`: `1` 이상
    - `bottom`: `1` 이상
    - `outer`: `1` 이상

**다음 단계로 넘어가기 전:**
- 모든 저장한 아이템이 목록에 표시되는지 확인
- 카테고리별 개수가 정확한지 확인

---

#### 6단계: 옷장 아이템 목록 조회 (top 카테고리 필터링)

**API 호출:**
- `GET {{api_base}}/closet?category=top&page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.items`: 배열
    - 모든 아이템의 `category`가 `"top"`인지 확인
    - 2단계에서 저장한 top 아이템이 포함되어 있는지 확인
    - bottom, outer 아이템은 포함되지 않았는지 확인
  - `data.categoryCounts`:
    - 필터와 관계없이 전체 카테고리별 개수 반환되는지 확인
    - `top`, `bottom`, `outer` 모두 포함

**다음 단계로 넘어가기 전:**
- top 카테고리 필터링이 정상적으로 작동하는지 확인
- categoryCounts는 필터와 무관하게 전체 개수를 반환하는지 확인

---

#### 7단계: 옷장 아이템 목록 조회 (bottom 카테고리 필터링)

**API 호출:**
- `GET {{api_base}}/closet?category=bottom&page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.items`: 배열
    - 모든 아이템의 `category`가 `"bottom"`인지 확인
    - 3단계에서 저장한 bottom 아이템이 포함되어 있는지 확인
    - top, outer 아이템은 포함되지 않았는지 확인
  - `data.categoryCounts`:
    - 전체 카테고리별 개수가 여전히 반환되는지 확인

**다음 단계로 넘어가기 전:**
- bottom 카테고리 필터링이 정상적으로 작동하는지 확인

---

#### 8단계: 옷장 아이템 목록 조회 (outer 카테고리 필터링)

**API 호출:**
- `GET {{api_base}}/closet?category=outer&page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.items`: 배열
    - 모든 아이템의 `category`가 `"outer"`인지 확인
    - 4단계에서 저장한 outer 아이템이 포함되어 있는지 확인
    - top, bottom 아이템은 포함되지 않았는지 확인
  - `data.categoryCounts`:
    - 전체 카테고리별 개수가 여전히 반환되는지 확인

**다음 단계로 넘어가기 전:**
- outer 카테고리 필터링이 정상적으로 작동하는지 확인

---

#### 9단계: 옷장에서 아이템 삭제

**API 호출:**
- `DELETE {{api_base}}/closet/items/{itemId1}`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `itemId1` (2단계에서 저장한 아이템 ID)

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.message`: `"옷장에서 삭제되었습니다"`
  - `data.deletedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 아이템이 정상적으로 삭제되었는지 확인

---

#### 10단계: 옷장 아이템 목록 재조회 (삭제 확인)

**API 호출:**
- `GET {{api_base}}/closet?category=all&page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.items`: 배열
    - 9단계에서 삭제한 아이템이 목록에서 제외되었는지 확인
    - 3, 4단계에서 저장한 아이템은 여전히 목록에 있는지 확인
  - `data.pagination`:
    - `totalItems`: 5단계보다 1 감소했는지 확인 (3개 → 2개)
  - `data.categoryCounts`:
    - 삭제한 카테고리(top)의 개수가 1 감소했는지 확인

**최종 확인:**
- [ ] 아이템 삭제가 정상적으로 반영됨
- [ ] 목록에서 해당 아이템이 제외됨
- [ ] 다른 아이템은 유지됨
- [ ] categoryCounts가 정확하게 업데이트됨

---

### 시나리오 5: 가상 피팅 플로우

**목적:** 가상 피팅을 시작하고, 상태를 조회하며, 완료된 결과를 확인하고, 이력을 관리하는 플로우를 검증합니다.

**전제 조건:**
- 시나리오 1을 완료한 사용자 (온보딩 완료)
- 유효한 JWT 토큰 (`{{token}}`)
- 사용자 프로필 사진이 업로드되어 있음 (시나리오 1의 7단계 완료)
- 데이터베이스에 아이템이 존재

**단계별 테스트:**

#### 1단계: 사용자 프로필 사진 확인

**API 호출:**
- `GET {{api_base}}/auth/me`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.user.profileImageUrl`: `null`이 아님
    - 프로필 사진이 업로드되어 있는지 확인
    - 사진이 없으면 시나리오 1의 7단계를 먼저 수행

**다음 단계로 넘어가기 전:**
- 프로필 사진이 업로드되어 있는지 확인 (필수)

---

#### 2단계: 가상 피팅용 아이템 확인

**API 호출:**
- `GET {{api_base}}/recommendations?page=1&limit=1`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.outfits[0].items`: 배열 (최소 1개 이상)
    - 각 아이템의 `id`, `category`, `imageUrl` 확인
- [ ] 가상 피팅에 사용할 아이템 정보 메모
  - 최소 1개, 최대 3개
  - 카테고리별로 1개씩만 선택 가능 (top, bottom, outer)
  - 예: `itemId1` (top), `itemId2` (bottom)

**다음 단계로 넘어가기 전:**
- 가상 피팅에 사용할 아이템 정보를 확인

---

#### 3단계: 가상 피팅 시작 (1개 아이템)

**API 호출:**
- `POST {{api_base}}/virtual-fitting`
- Headers: `Authorization: Bearer {{token}}`
- Body:
  ```json
  {
    "items": [
      {
        "itemId": 5562350,
        "category": "top",
        "imageUrl": "https://image.msscdn.net/..."
      }
    ]
  }
  ```
  > **참고:** 2단계에서 확인한 실제 아이템 정보 사용

**검증 항목:**
- [ ] HTTP 상태 코드: `202 Accepted`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.jobId`: 숫자 (피팅 작업 ID)
  - `data.status`: `"processing"`
  - `data.createdAt`: ISO 8601 형식의 날짜 문자열
- [ ] `jobId`를 메모 (예: `jobId = 1234`)

**다음 단계로 넘어가기 전:**
- 피팅 작업이 시작되었는지 확인
- jobId를 다음 단계에서 사용하기 위해 메모

---

#### 4단계: 가상 피팅 상태 조회 (Processing)

**API 호출:**
- `GET {{api_base}}/virtual-fitting/{jobId}`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `jobId` (3단계에서 반환된 jobId)

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.jobId`: 3단계에서 반환된 jobId와 일치
  - `data.status`: `"processing"`
  - `data.currentStep`: 문자열
    - "top", "bottom", "outer" 중 하나
    - 3단계에서 선택한 카테고리와 일치하는지 확인

**다음 단계로 넘어가기 전:**
- 피팅 작업이 진행 중인지 확인
- 실제 피팅이 완료될 때까지 대기 (수초 ~ 수분 소요)
- 완료될 때까지 이 단계를 반복 조회할 수 있음

---

#### 5단계: 가상 피팅 상태 재조회 (Completed)

**API 호출:**
- `GET {{api_base}}/virtual-fitting/{jobId}`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `jobId` (3단계에서 반환된 jobId)

**참고:** 피팅이 완료될 때까지 이 API를 주기적으로 호출합니다 (예: 5초마다)

**검증 항목 (Completed 상태):**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.jobId`: 3단계에서 반환된 jobId와 일치
  - `data.status`: `"completed"`
  - `data.resultImageUrl`: 문자열 (예: `/uploads/fitting/fitting_1234_20251116_100000.png`)
    - 경로가 `/uploads/fitting/fitting_{jobId}_`로 시작하는지 확인
  - `data.llmMessage`: 문자열 또는 `null`
    - `null`인 경우 "메시지 생성 중 오류가 발생했습니다"로 대체되는지 확인
    - 문자열인 경우 코디에 대한 설명이 포함되어 있는지 확인
  - `data.completedAt`: ISO 8601 형식의 날짜 문자열
  - `data.processingTime`: 숫자 (초 단위, 예: 330)

**다음 단계로 넘어가기 전:**
- 피팅 작업이 완료되었는지 확인
- 결과 이미지 URL이 정상적으로 반환되는지 확인

---

#### 6단계: 가상 피팅 이력 조회

**API 호출:**
- `GET {{api_base}}/virtual-fitting?page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.fittings`: 배열 (최소 1개)
    - 3단계에서 시작한 피팅 작업이 포함되어 있는지 확인
    - 각 피팅 확인:
      - `jobId`: 3단계에서 반환된 jobId와 일치하는 항목 찾기
      - `status`: `"completed"`
      - `resultImageUrl`: 5단계에서 확인한 URL과 일치
      - `items`: 배열
        - 3단계에서 선택한 아이템 정보 포함
        - 각 아이템: `itemId`, `category`, `name` 포함
      - `createdAt`: ISO 8601 형식의 날짜 문자열
    - 생성 일시 기준 최신순으로 정렬되는지 확인
      - 가장 최근에 생성한 피팅(3단계)이 첫 번째로 나타나는지 확인
  - `data.pagination`:
    - `currentPage`: `1`
    - `totalItems`: `1` 이상
    - `hasNext`: boolean
    - `hasPrev`: `false` (첫 페이지)

**다음 단계로 넘어가기 전:**
- 피팅 이력이 정상적으로 표시되는지 확인
- 결과 이미지 URL이 포함되어 있는지 확인

---

#### 7단계: 가상 피팅 이력 삭제

**API 호출:**
- `DELETE {{api_base}}/virtual-fitting/{jobId}`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `jobId` (3단계에서 반환된 jobId)

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.message`: `"가상 피팅 이력이 삭제되었습니다"`
  - `data.deletedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 피팅 이력이 정상적으로 삭제되었는지 확인

---

#### 8단계: 가상 피팅 이력 재조회 (삭제 확인)

**API 호출:**
- `GET {{api_base}}/virtual-fitting?page=1&limit=20`
- Headers: `Authorization: Bearer {{token}}`

**검증 항목:**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.fittings`: 배열
    - 7단계에서 삭제한 피팅 작업이 목록에서 제외되었는지 확인
    - 다른 피팅 이력은 유지되는지 확인
  - `data.pagination`:
    - `totalItems`: 6단계보다 1 감소했는지 확인

**최종 확인:**
- [ ] 피팅 이력 삭제가 정상적으로 반영됨
- [ ] 목록에서 해당 이력이 제외됨
- [ ] 다른 피팅 이력은 유지됨

---

### 시나리오 6: 가상 피팅 실패 및 타임아웃 플로우

**목적:** 가상 피팅의 실패 및 타임아웃 상태를 검증합니다.

**전제 조건:**
- 시나리오 1을 완료한 사용자 (온보딩 완료, 프로필 사진 업로드됨)
- 유효한 JWT 토큰 (`{{token}}`)

**단계별 테스트:**

#### 1단계: 가상 피팅 시작

**API 호출:**
- `POST {{api_base}}/virtual-fitting`
- Headers: `Authorization: Bearer {{token}}`
- Body:
  ```json
  {
    "items": [
      {
        "itemId": 5562350,
        "category": "top",
        "imageUrl": "https://image.msscdn.net/..."
      }
    ]
  }
  ```

**검증 항목:**
- [ ] HTTP 상태 코드: `202 Accepted`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.jobId`: 숫자
  - `data.status`: `"processing"`
- [ ] `jobId`를 메모

**참고:** 실제 실패나 타임아웃을 발생시키기 어려운 경우, 이미 실패/타임아웃 상태인 작업 ID를 사용할 수 있습니다.

---

#### 2단계: 가상 피팅 상태 조회 (Failed 상태)

**API 호출:**
- `GET {{api_base}}/virtual-fitting/{jobId}`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `jobId` (실패 상태인 jobId)

**검증 항목 (Failed 상태):**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.jobId`: jobId와 일치
  - `data.status`: `"failed"`
  - `data.error`: 문자열 (예: "상의 피팅 중 오류가 발생했습니다")
  - `data.failedStep`: 문자열 ("top", "bottom", "outer" 중 하나)
  - `data.failedAt`: ISO 8601 형식의 날짜 문자열

**다음 단계로 넘어가기 전:**
- 실패 상태가 정상적으로 표시되는지 확인

---

#### 3단계: 가상 피팅 상태 조회 (Timeout 상태)

**API 호출:**
- `GET {{api_base}}/virtual-fitting/{jobId}`
- Headers: `Authorization: Bearer {{token}}`
- Path Parameters: `jobId` (타임아웃 상태인 jobId)

**검증 항목 (Timeout 상태):**
- [ ] HTTP 상태 코드: `200 OK`
- [ ] 응답 구조 확인:
  - `success: true`
  - `data.jobId`: jobId와 일치
  - `data.status`: `"timeout"`
  - `data.error`: 문자열 (예: "처리 시간을 초과했습니다 (300초)")
  - `data.timeoutAt`: ISO 8601 형식의 날짜 문자열

**최종 확인:**
- [ ] 실패 및 타임아웃 상태가 정상적으로 처리됨
- [ ] 에러 메시지가 명확하게 표시됨

---

## 다음 엔드포인트 추가 예정

- ... (계속 추가)

