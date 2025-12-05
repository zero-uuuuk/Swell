/**
 * Step 2: 태그 선택 컴포넌트
 */
import React from 'react';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';

export function Step2TagSelection({
  tags = [], // API에서 받은 태그 목록 [{ id, name }, ...]
  selectedTagIds = [], // 선택된 태그 ID 배열
  onToggleTag,
  onPrevious,
  onNext,
  validation
}) {
  return (
    <div className="flex-1 flex flex-col animate-enter">
      <div className="mb-8 stagger-item" style={{ animationDelay: '100ms' }}>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          당신의 스타일을 알려주세요
        </h2>
        <p className="text-slate-500">
          평소 선호하거나 관심 있는 스타일 키워드를 선택해주세요. (최소 3개, 최대 10개)
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-12">
        {tags.map((tag, index) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => onToggleTag(tag.id)}
              style={{ animationDelay: `${150 + index * 30}ms` }}
              className={`
                stagger-item relative px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out
                border group overflow-hidden break-keep
                ${isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 scale-[1.02]'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'}
              `}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSelected && <Check size={14} className="stroke-[3]" />}
                {tag.name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="mt-auto pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 stagger-item"
        style={{ animationDelay: '600ms' }}
      >
        <div className="flex items-center gap-4">
          <button onClick={onPrevious} className="text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <p className={`text-sm font-medium transition-colors ${!validation.isValid ? 'text-rose-500' : 'text-emerald-600'}`}>
            {validation.message}
          </p>
        </div>
        <button
          onClick={onNext}
          disabled={!validation.isValid}
          className={`
            flex items-center gap-2 px-8 py-3.5 rounded-full font-bold transition-all duration-300
            ${validation.isValid
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 hover:translate-y-[-2px]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
          `}
        >
          다음 단계
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

