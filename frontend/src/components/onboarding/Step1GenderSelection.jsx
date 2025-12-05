/**
 * Step 1: 성별 선택 컴포넌트
 */
import React from 'react';
import { GENDERS } from '../../constants/onboarding';

export function Step1GenderSelection({ gender, onSelect }) {
  return (
    <div className="flex-1 flex flex-col animate-enter items-center justify-center">
      <div className="text-center mb-12 stagger-item" style={{ animationDelay: '100ms' }}>
        <h2 className="text-3xl font-bold text-slate-800 mb-3">
          반가워요!
        </h2>
        <p className="text-slate-500 text-lg">
          맞춤형 스타일 추천을 위해 성별을 선택해주세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-lg mb-12">
        {GENDERS.map((g, idx) => (
          <button
            key={g}
            onClick={() => onSelect(g)}
            style={{ animationDelay: `${200 + idx * 100}ms` }}
            className={`
              stagger-item relative aspect-square rounded-3xl text-xl font-bold transition-all duration-300
              flex flex-col items-center justify-center gap-4 group
              ${gender === g
                ? 'bg-slate-900 text-white shadow-xl scale-105'
                : 'bg-white/60 hover:bg-white text-slate-700 hover:shadow-lg hover:-translate-y-1'}
            `}
          >
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-colors
              ${gender === g ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}
            `}>
              {g === '여성' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="10" r="4" />
                  <path d="M12 20v-6" />
                  <path d="M9 17h6" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="14" r="4" />
                  <path d="M13 11L21 3" />
                  <path d="M21 3h-6" />
                  <path d="M21 3v6" />
                </svg>
              )}
            </div>
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

