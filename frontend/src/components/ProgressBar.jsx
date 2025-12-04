/**
 * 진행 바 컴포넌트
 */
import React from 'react';

export function ProgressBar({ step, totalSteps = 3, isCompleting = false }) {
  const progress = isCompleting ? 100 : ((step - 1) / totalSteps) * 100;

  return (
    <div className="w-full h-1.5 bg-gray-200">
      <div
        className="h-full bg-slate-900 transition-all duration-700 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

