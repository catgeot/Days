import React from 'react';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

const PreTravelChecklist = ({ items }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 mb-5 shadow-sm">
            <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-sm md:text-base">
                <AlertCircle className="text-amber-600 shrink-0" size={18} />
                출발 전 필수 준비사항
            </h3>
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                            <div>
                                <p className="text-xs md:text-sm font-bold text-gray-800">{item.title}</p>
                                {item.cost && <p className="text-[10px] md:text-xs text-gray-500 font-medium">{item.cost}</p>}
                            </div>
                        </div>
                        {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                <span>바로가기</span>
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PreTravelChecklist;
