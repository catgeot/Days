/**
 * iframe 제휴 배너 우상단 뱃지.
 * Trip.com 등 파트너 UI의 닫기(X) 버튼과 겹치지 않도록 자신의 너비만큼 왼쪽으로 둡니다.
 */
const PlannerAffiliateLinkBadge = ({ label = '제휴링크', className = '' }) => (
    <div
        className={`pointer-events-none absolute right-0 top-0 z-10 -translate-x-full rounded-bl-lg bg-gradient-to-r from-blue-600 to-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ${className}`.trim()}
        aria-hidden
    >
        {label}
    </div>
);

export default PlannerAffiliateLinkBadge;
