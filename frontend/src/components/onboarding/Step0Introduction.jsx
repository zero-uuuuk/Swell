import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { SwellLogo } from '../SwellLogo';

export function Step0Introduction({ onNext }) {
    return (
        <div className="flex flex-col h-full animate-enter">
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 max-w-2xl mx-auto">

                {/* Header Section */}
                <div className="space-y-4 stagger-item" style={{ animationDelay: '100ms' }}>
                    <div className="inline-flex items-center justify-center mb-2">
                        <SwellLogo className="w-20 h-20 drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                        SWELL에 오신 것을 환영합니다
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-lg mx-auto">
                        저희는 패션 편의성 개선 서비스를 제작 중인 SWELL 개발팀입니다.<br />
                        현재 <span className="font-bold text-cyan-600">Cold-Start 추천 성능</span>을 테스트하고 있습니다.
                    </p>
                </div>

                {/* Guide Section */}
                <div className="w-full bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-100 shadow-sm stagger-item" style={{ animationDelay: '200ms' }}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-cyan-500" />
                        <span>테스트 진행 가이드</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {[
                            { step: 1, text: "성별을 선택해주세요" },
                            { step: 2, text: "선호하는 스타일 키워드를 선택해주세요" },
                            { step: 3, text: "마음에 드는 코디 이미지를 골라주세요" },
                            { step: 4, text: "추천 결과를 확인하고 설문(구글폼)을 제출해주세요" }
                        ].map((item) => (
                            <div key={item.step} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    {item.step}
                                </div>
                                <span className="text-slate-700 font-medium text-sm">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Footer Action */}
            <div className="mt-8 flex flex-col items-center stagger-item" style={{ animationDelay: '300ms' }}>
                <button
                    onClick={onNext}
                    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-slate-900 font-lg rounded-full hover:bg-slate-800 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 mb-8"
                >
                    <span>테스트 시작하기</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Disclaimers */}
                <div className="text-center space-y-1.5 opacity-80 hover:opacity-100 transition-opacity duration-300">
                    <p className="text-[11px] md:text-xs text-slate-500 font-medium">
                        * 본 서비스는 추천 알고리즘 성능 평가를 위한 연구 목적으로 제작되었으며, 수집된 데이터는 상업적으로 이용되지 않습니다.
                    </p>
                    <p className="text-[11px] md:text-xs text-slate-500 font-medium">
                        * 본 서비스는 PC(Chrome 권장) 및 iPad 환경에 최적화되어 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
