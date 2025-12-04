/**
 * API 엔드포인트 상수
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://swell-513885138419.asia-northeast3.run.app';

export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },

  // 사용자
  USERS: {
    ME: '/api/users/me',
    UPDATE_PROFILE: '/api/users/me',
    UPLOAD_IMAGE: '/api/users/me/image',
  },

  // 온보딩
  ONBOARDING: {
    GET_PREFERENCES_OPTIONS: '/api/users/preferences/options', // 태그 및 샘플 코디 옵션
    SUBMIT_PREFERENCES: '/api/users/preferences', // 선호도 설정
  },

  // 추천
  RECOMMENDATIONS: {
    GET_RECOMMENDATIONS: '/api/recommendations',
  },

  // 코디
  OUTFITS: {
    LIKE: '/api/outfits/:id/like',
    VIEW: '/api/outfits/:id/view',
  },

  // 아이템
  ITEMS: {
    SAVE_TO_CLOSET: '/api/closet/items',
  },
};

