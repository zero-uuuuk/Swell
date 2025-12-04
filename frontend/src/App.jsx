/**
 * 메인 App 컴포넌트
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useOnboarding } from './hooks/useOnboarding';
import { useRecommendations } from './hooks/useRecommendations';
import { submitPreferences, getPreferencesOptions } from './services/onboardingService';
import { STEP_TITLES, STEP_BADGES } from './constants/onboarding';
import { Background } from './components/Background';
import { ProgressBar } from './components/ProgressBar';
import { Header } from './components/Header';
import { Step1GenderSelection } from './components/onboarding/Step1GenderSelection';
import { Step2TagSelection } from './components/onboarding/Step2TagSelection';
import { Step3OutfitSelection } from './components/onboarding/Step3OutfitSelection';
import { LoadingScreen } from './components/results/LoadingScreen';
import { RecommendationView } from './components/results/RecommendationView';
import './styles/global.css';

function App() {
  const onboarding = useOnboarding();
  const recommendations = useRecommendations();
  const [tags, setTags] = useState([]); // API에서 받은 태그 목록
  const [sampleOutfits, setSampleOutfits] = useState([]);

  // 선호도 옵션 로드 함수
  const loadPreferencesOptions = useCallback(async () => {
    if (!onboarding.gender) return;

    try {
      // 성별을 쿼리 파라미터로 전달 ("여성" -> "female", "남성" -> "male")
      const data = await getPreferencesOptions(onboarding.gender);
      setTags(data.hashtags || []);

      // 샘플 코디도 함께 변환
      const outfits = (data.sampleOutfits || []).map((outfit, idx) => ({
        id: outfit.id,
        url: outfit.imageUrl || outfit.image_url || '',
        alt: `코디 ${idx + 1}`,
      }));
      setSampleOutfits(outfits);
    } catch (error) {
      console.error('Failed to load preferences options:', error);
      // Fallback 처리
      setTags([]);
      setSampleOutfits([]);
    }
  }, [onboarding.gender]);

  // Step 2에서 태그 및 샘플 코디 옵션 로드
  useEffect(() => {
    if (onboarding.step === 2 && onboarding.gender) {
      // 성별이 변경되면 태그와 코디를 초기화하고 다시 로드
      setTags([]);
      setSampleOutfits([]);
      loadPreferencesOptions();
    }
  }, [onboarding.step, onboarding.gender, loadPreferencesOptions]);

  // Step 3에서 샘플 코디 로드
  useEffect(() => {
    if (onboarding.step === 3 && sampleOutfits.length === 0 && tags.length > 0) {
      // 이미 Step 2에서 로드했으므로 변환만 수행
      convertSampleOutfits();
    }
  }, [onboarding.step]);

  const convertSampleOutfits = () => {
    // 이미 로드된 경우 변환만 수행
    if (sampleOutfits.length === 0) {
      // Fallback: 기본 이미지 사용
      setSampleOutfits(Array.from({ length: 10 }).map((_, idx) => ({
        id: idx + 1,
        url: `https://images.unsplash.com/photo-${1515886657613 + idx}?q=80&w=1920&auto=format&fit=crop`,
        alt: `코디 ${idx + 1}`,
      })));
    }
  };

  const [isCompleting, setIsCompleting] = useState(false);

  // 온보딩 완료 처리
  const handleOnboardingComplete = async () => {
    setIsCompleting(true); // 프로그레스 바 100% 애니메이션 시작

    // 애니메이션을 위해 잠시 대기
    setTimeout(async () => {
      onboarding.goToNextStep(); // Step 4로 이동
      setIsCompleting(false);

      // Cold-Start 테스트: 온보딩 데이터를 추천 API에 전달
      const onboardingData = onboarding.getOnboardingData();
      recommendations.loadRecommendations({
        gender: onboarding.gender, // "여성" 또는 "남성"
        hashtagIds: onboardingData.hashtagIds || [],
        sampleOutfitIds: onboardingData.sampleOutfitIds || [],
      });

      try {
        // 온보딩 데이터 제출 (비동기로 실행, 추천과 병렬 처리)
        await submitPreferences(onboardingData);
      } catch (error) {
        console.error('Failed to submit preferences:', error);
        // 에러가 발생해도 추천은 계속 진행
      }
    }, 600); // 600ms 대기 (애니메이션 시간 고려)
  };

  // 추천 좋아요 처리
  const handleLike = async () => {
    if (recommendations.currentRecommendation) {
      try {
        // TODO: API 호출 구현
        // await likeCoordi(recommendations.currentRecommendation.id);
        console.log('Like:', recommendations.currentRecommendation.id);
      } catch (error) {
        console.error('Failed to like coordi:', error);
      }
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-gray-50 overflow-hidden font-sans text-slate-900">
      <Background />

      {/* 메인 컨테이너 */}
      <div className={`
        relative z-10 w-full mx-4 my-8 flex flex-col bg-white/70 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-slate-900/10 border border-white/60 overflow-hidden transition-all duration-700
        ${onboarding.step === 4 ? 'max-w-[95vw] h-[92vh] min-h-[600px]' : 'max-w-5xl min-h-[700px]'}
      `}>

        {/* 상단 진행 바 */}
        {onboarding.step < 4 && (
          <ProgressBar step={onboarding.step} totalSteps={3} isCompleting={isCompleting} />
        )}

        {/* 콘텐츠 영역 */}
        <div className="flex-1 p-6 md:p-10 flex flex-col h-full overflow-hidden">

          {/* 헤더 */}
          <Header
            step={onboarding.step}
            title={STEP_TITLES[onboarding.step]}
            badge={STEP_BADGES[onboarding.step]}
          />

          {/* 라우팅 설정 */}
          <Routes>
            <Route path="/" element={<Navigate to="/step1" replace />} />

            {/* STEP 1: 성별 선택 */}
            <Route path="/step1" element={
              <Step1GenderSelection
                gender={onboarding.gender}
                onSelect={onboarding.selectGender}
              />
            } />

            {/* STEP 2: 태그 선택 */}
            <Route path="/step2" element={
              <Step2TagSelection
                tags={tags}
                selectedTagIds={onboarding.selectedTags}
                onToggleTag={onboarding.toggleTag}
                onPrevious={onboarding.goToPreviousStep}
                onNext={onboarding.goToNextStep}
                validation={onboarding.tagValidation}
              />
            } />

            {/* STEP 3: 코디 선택 */}
            <Route path="/step3" element={
              <Step3OutfitSelection
                outfits={sampleOutfits}
                selectedOutfits={onboarding.selectedOutfits}
                currentTab={onboarding.currentOutfitTab}
                onToggleOutfit={onboarding.toggleOutfit}
                onTabChange={onboarding.setCurrentOutfitTab}
                onPrevious={onboarding.goToPreviousStep}
                onNext={onboarding.goToNextStep}
                onComplete={handleOnboardingComplete}
                validation={onboarding.outfitValidation}
              />
            } />

            {/* STEP 4: 결과 화면 */}
            <Route path="/result" element={
              <>
                {recommendations.isLoading ? (
                  <LoadingScreen />
                ) : (
                  <RecommendationView
                    recommendation={recommendations.currentRecommendation}
                    currentIndex={recommendations.currentIndex}
                    totalCount={recommendations.recommendations.length}
                    isTransitioning={recommendations.isTransitioning}
                    onChangeRecommendation={recommendations.changeRecommendation}
                    onReset={onboarding.reset}
                    onLike={handleLike}
                  />
                )}
              </>
            } />
          </Routes>

        </div>
      </div>
    </div>
  );
}

export default App;
