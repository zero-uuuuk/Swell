/**
 * Step 3: 코디 선택 컴포넌트
 */
import React from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ONBOARDING_LIMITS } from '../../constants/onboarding';

export function Step3OutfitSelection({
  outfits,
  selectedOutfits,
  currentTab,
  onToggleOutfit,
  onTabChange,
  onPrevious,
  onNext,
  onComplete,
  validation,
}) {
  const currentTabOutfits = outfits.slice(
    currentTab * ONBOARDING_LIMITS.OUTFITS_PER_TAB,
    (currentTab + 1) * ONBOARDING_LIMITS.OUTFITS_PER_TAB
  );

  return (
    <div className="flex-1 flex flex-col animate-enter">
      <div className="mb-6 stagger-item" style={{ animationDelay: '100ms' }}>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            마음에 드는 룩을 골라보세요
          </h2>
          <p className="text-slate-500">
            추구하는 분위기와 가장 비슷한 코디를 <strong>{ONBOARDING_LIMITS.REQUIRED_OUTFITS}개</strong> 선택해주세요.{' '}
            <span className={`text-sm ml-2 ${validation.isValid ? 'text-emerald-600' : 'text-rose-500'}`}>
              (현재 {selectedOutfits.length}/{ONBOARDING_LIMITS.REQUIRED_OUTFITS})
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
        {currentTabOutfits.map((outfit, index) => {
          const isSelected = selectedOutfits.includes(outfit.id);
          return (
            <div
              key={outfit.id}
              onClick={() => onToggleOutfit(outfit.id)}
              style={{ animationDelay: `${200 + index * 50}ms` }}
              className={`
                stagger-item group relative aspect-[3/4] cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
                ${isSelected ? 'ring-4 ring-slate-900 ring-offset-2 ring-offset-white/0 shadow-xl' : 'hover:shadow-lg hover:-translate-y-1'}
              `}
            >
              <img
                src={outfit.url}
                alt={outfit.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-black/20' : 'bg-transparent group-hover:bg-black/10'}`}>
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-slate-900 text-white rounded-full p-1.5 shadow-sm animate-scaleIn">
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-auto pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 stagger-item"
        style={{ animationDelay: '500ms' }}
      >
        <button
          onClick={() => {
            if (currentTab === 0) onPrevious();
            else onTabChange(0);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-slate-600 font-medium hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
          이전으로
        </button>

        {/* 페이지네이션 (중간) - Best Practice: 통합된 네비게이션 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange(0)}
            disabled={currentTab === 0}
            className={`
              p-2 rounded-full transition-all
              ${currentTab === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
            `}
            aria-label="이전 페이지"
          >
            <ChevronLeft size={20} />
          </button>

          {/* 페이지 인디케이터 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange(0)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${currentTab === 0
                  ? 'bg-slate-900 w-8'
                  : 'bg-slate-300 hover:bg-slate-400'}
              `}
              aria-label="페이지 1"
            />
            <button
              onClick={() => onTabChange(1)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${currentTab === 1
                  ? 'bg-slate-900 w-8'
                  : 'bg-slate-300 hover:bg-slate-400'}
              `}
              aria-label="페이지 2"
            />
          </div>

          <button
            onClick={() => {
              if (currentTab === 0) onTabChange(1);
            }}
            disabled={currentTab === 1}
            className={`
              p-2 rounded-full transition-all
              ${currentTab === 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
            `}
            aria-label="다음 페이지"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          onClick={() => {
            if (currentTab === 0) onTabChange(1);
            else onComplete();
          }}
          disabled={currentTab === 1 && !validation.isValid}
          className={`
            px-10 py-3.5 rounded-full font-bold text-white transition-all duration-300 flex items-center gap-2
            ${(currentTab === 0 || validation.isValid)
              ? 'bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 hover:translate-y-[-2px]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
          `}
        >
          {currentTab === 0 ? (
            <>
              다음 페이지 <ChevronRight size={18} />
            </>
          ) : (
            "스타일 분석하기"
          )}
        </button>
      </div>
    </div>
  );
}

