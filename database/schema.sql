/* 1. 사용자 기본 정보 */
CREATE TABLE Users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    preferred_tags TEXT COMMENT '사용자 선호 태그 (콤마 구분 텍스트)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* 2. 판매하는 개별 상품 */
CREATE TABLE Items (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_type ENUM('상의', '하의', '신발', '가방', '모자') NOT NULL,
    brand_name_ko VARCHAR(100),
    price DECIMAL(10, 2),
    purchase_url VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_items_type (item_type),
    INDEX idx_items_brand_ko (brand_name_ko)
);

/* 3. 크롤링으로 수집한 코디 */
CREATE TABLE Coordis (
    coordi_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    season ENUM('SPRING', 'SUMMER', 'FALL', 'WINTER') COMMENT '4계절 (필터링용)',
    style ENUM('CASUAL', 'STREET', 'FORMAL', 'MINIMAL') COMMENT '코디 무드/스타일',
    description TEXT COMMENT '태그 포함 설명 문구',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_coordis_season_style (season, style),
    INDEX idx_coordis_style (style)
) COMMENT '코디 세트';

/* 4. 가상 피팅 결과물 */
CREATE TABLE Fitting_Results (
    fitting_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL COMMENT '어떤 아이템을 피팅했는지',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fitting_results_user_item (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE
) COMMENT '가상 피팅 실행 이력';

/* 5-1. 사용자 이미지 */
CREATE TABLE User_Images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    image_url VARCHAR(1024) NOT NULL COMMENT '사용자의 전신 사진 URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_images_user (user_id),
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
) COMMENT '사용자의 프로필/가상 피팅 원본 사진';

/* 5-2. 아이템 이미지 */
CREATE TABLE Item_Images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    image_url VARCHAR(1024) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE COMMENT '대표 썸네일 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_images_item (item_id, is_main),

    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE,
) COMMENT '상품의 상세 이미지';

/* 5-3. 코디 이미지 */
CREATE TABLE Coordi_Images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    coordi_id BIGINT NOT NULL,
    image_url VARCHAR(1024) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE COMMENT '대표 썸네일 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_coordi_images_coordi (coordi_id, is_main),

    FOREIGN KEY (coordi_id) REFERENCES Coordis(coordi_id) ON DELETE CASCADE,
) COMMENT '크롤링한 코디 이미지';

/* 5-4. 가상 피팅 결과 이미지 */
CREATE TABLE Fitting_Result_Images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fitting_id BIGINT NOT NULL,
    image_url VARCHAR(1024) NOT NULL COMMENT 'AI가 생성한 피팅 결과물 URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fitting_result_images_fitting (fitting_id),
    
    FOREIGN KEY (fitting_id) REFERENCES Fitting_Results(fitting_id) ON DELETE CASCADE,
) COMMENT '가상 피팅 결과물 이미지';


/* ----- 관계 테이블 ----- */
/* 1. 코디와 아이템의 N:M 관계 테이블 */
CREATE TABLE Coordi_Items (
    coordi_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    PRIMARY KEY (coordi_id, item_id),
    INDEX idx_coordi_items_item (item_id),
    FOREIGN KEY (coordi_id) REFERENCES Coordis(coordi_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE
) COMMENT '하나의 코디를 구성하는 아이템들';

/* 2. 사용자의 코디 스와이프 이력 */
CREATE TABLE User_Coordi_Interactions (
    user_id BIGINT NOT NULL,
    coordi_id BIGINT NOT NULL,
    action_type ENUM('LIKE', 'SKIP') NOT NULL,
    interacted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, coordi_id),
    INDEX idx_user_coordi_interactions_coordi (coordi_id, action_type),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (coordi_id) REFERENCES Coordis(coordi_id) ON DELETE CASCADE
);

/* 3. 사용자의 코디 상세 조회 이력 (머무른 시간) */
CREATE TABLE User_Coordi_View_Logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coordi_id BIGINT NOT NULL,
    view_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '조회 시작 시간',
    duration_seconds INT NOT NULL COMMENT '머무른 시간 (초)',
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (coordi_id) REFERENCES Coordis(coordi_id) ON DELETE CASCADE,
    INDEX idx_user_coordi (user_id, coordi_id),
    INDEX idx_coordi_view_logs_coordi_time (coordi_id, view_started_at)
) COMMENT '사용자가 특정 코디를 얼마나 오래 봤는지 기록 (추천용)';

/* 4. 사용자가 '옷장 추가' 누른 아이템 (내 옷장) */
CREATE TABLE User_Closet_Items (
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id),
    INDEX idx_user_closet_items_item (item_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE
) COMMENT '사용자의 가상 옷장';


/* 5. 사용자의 아이템 상세 조회 이력 (머무른 시간) */
CREATE TABLE User_Item_View_Logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL COMMENT '조회한 아이템 ID',
    view_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '조회 시작 시간',
    duration_seconds INT NOT NULL COMMENT '머무른 시간 (초)',
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE,
    INDEX idx_user_item (user_id, item_id)
) COMMENT '사용자가 특정 아이템을 얼마나 오래 봤는지 기록 (추천용)';
---
/* 추천 시스템에 따른 결과(ex. 1시간마다 업데이트됨)는 Redis에 서빙할 예정*/