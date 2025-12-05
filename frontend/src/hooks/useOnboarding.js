
/**
 * 온보딩 관련 커스텀 훅
 */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ONBOARDING_LIMITS } from '../constants/onboarding';
import { validateTags, validateOutfits } from '../utils/validation';
import { saveGender } from '../utils/storage';

// 모듈 레벨 변수: 새로고침 시 false로 초기화됨
let hasVisitedIntro = false;

export function useOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();

  // URL 경로를 기반으로 현재 단계 결정
  const getStepFromPath = () => {
    const path = location.pathname;
    if (path === '/step1') return 1;
    if (path === '/step2') return 2;
    if (path === '/step3') return 3;
    if (path === '/result') return 4;
    return 0; // 기본값 (/) -> 0단계 (소개)
  };

  const step = getStepFromPath();

  const [gender, setGender] = useState(null); // 새로고침 시 초기화되도록 로컬 스토리지 로드 제거
  const [selectedTags, setSelectedTags] = useState([]); // 태그 ID 배열
  const [selectedOutfits, setSelectedOutfits] = useState([]);
  const [currentOutfitTab, setCurrentOutfitTab] = useState(0);

  // 필수 데이터 누락 시 이전 단계로 리다이렉트
  useEffect(() => {
    // Step 1: Intro를 거치지 않고 접근했거나(새로고침 등), hasVisitedIntro가 false면 Intro로 리다이렉트
    if (step === 1 && !hasVisitedIntro) {
      navigate('/', { replace: true });
    }
    // Step 2 이상: 필수 데이터(성별)가 없으면 Intro로 리다이렉트
    else if (step > 1 && !gender) {
      navigate('/', { replace: true });
    } else if (step > 2 && selectedTags.length === 0) {
      navigate('/step2', { replace: true });
    } else if (step > 3 && selectedOutfits.length === 0) {
      navigate('/step3', { replace: true });
    }
  }, [step, gender, selectedTags.length, selectedOutfits.length, navigate]);

  // 성별 선택
  const selectGender = useCallback((selected) => {
    setGender(selected);
    saveGender(selected);
    setTimeout(() => navigate('/step2'), 300);
  }, [navigate]);

  // 태그 토글 (ID 기반)
  const toggleTag = useCallback((tagId) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        if (prev.length >= ONBOARDING_LIMITS.MAX_TAGS) {
          alert(`최대 ${ONBOARDING_LIMITS.MAX_TAGS}개까지만 선택할 수 있습니다.`);
          return prev;
        }
        return [...prev, tagId];
      }
    });
  }, []);

  // 코디 토글
  const toggleOutfit = useCallback((id) => {
    setSelectedOutfits(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= ONBOARDING_LIMITS.REQUIRED_OUTFITS) {
          alert(`정확히 ${ONBOARDING_LIMITS.REQUIRED_OUTFITS}개의 코디를 선택해주세요.`);
          return prev;
        }
        return [...prev, id];
      }
    });
  }, []);

  // 단계 이동
  const goToStep = useCallback((newStep) => {
    if (newStep === 0) navigate('/');
    else if (newStep === 1) navigate('/step1');
    else if (newStep === 2) navigate('/step2');
    else if (newStep === 3) navigate('/step3');
    else if (newStep === 4) navigate('/result');
  }, [navigate]);

  // 이전 단계로
  const goToPreviousStep = useCallback(() => {
    if (step > 0) {
      if (step === 1) navigate('/');
      else if (step === 2) navigate('/step1');
      else if (step === 3) navigate('/step2');
      else if (step === 4) navigate('/step3');
    }
  }, [step, navigate]);

  // 다음 단계로
  const goToNextStep = useCallback(() => {
    if (step < 4) {
      if (step === 0) {
        hasVisitedIntro = true; // Intro 방문 확인 플래그 설정
        navigate('/step1');
      }
      else if (step === 1) navigate('/step2');
      else if (step === 2) navigate('/step3');
      else if (step === 3) navigate('/result');
    }
  }, [step, navigate]);

  // 유효성 검사
  const tagValidation = validateTags(selectedTags, ONBOARDING_LIMITS.MIN_TAGS, ONBOARDING_LIMITS.MAX_TAGS);
  const outfitValidation = validateOutfits(selectedOutfits, ONBOARDING_LIMITS.REQUIRED_OUTFITS);

  const isStep2Complete = tagValidation.isValid;
  const isStep3Complete = outfitValidation.isValid;

  // 온보딩 데이터 수집
  const getOnboardingData = useCallback(() => {
    return {
      hashtagIds: selectedTags, // 태그 ID 배열
      sampleOutfitIds: selectedOutfits, // 코디 ID 배열
    };
  }, [selectedTags, selectedOutfits]);

  // 리셋
  const reset = useCallback(() => {
    navigate('/');
    setGender(null);
    setSelectedTags([]);
    setSelectedOutfits([]);
    setCurrentOutfitTab(0);
  }, [navigate]);

  return {
    // 상태
    step,
    gender,
    selectedTags,
    selectedOutfits,
    currentOutfitTab,

    // 액션
    selectGender,
    toggleTag,
    toggleOutfit,
    setCurrentOutfitTab,
    goToStep,
    goToPreviousStep,
    goToNextStep,
    reset,

    // 유효성 검사
    isStep2Complete,
    isStep3Complete,
    tagValidation,
    outfitValidation,

    // 데이터
    getOnboardingData,
  };
}

