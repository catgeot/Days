// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] UI(사이드바, 배경 등) 완전 제거. DailyLayout과 중복 렌더링 충돌(이중 사이드바 버그) 완벽 차단.
// 2. [Safe Path] 오직 로그인 상태(Auth Guard)만 검증하고 통과시키는 '투명 검문소'로 역할 축소.
// 3. [Routing] 인증 실패 시 App.jsx의 라우터 설정에 맞게 '/auth/login'으로 정확히 리다이렉트.

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white font-bold tracking-widest">인증 확인 중...</div>;

  // 🚨 [Fix] App.jsx에 정의된 인증 경로(/auth/login)와 일치시킴
  if (!session) {
    window.location.href = '/auth/login'; 
    return null;
  }

  // 🚨 [Fix] 모든 UI 껍데기 제거. 오직 하위 컴포넌트(DailyLayout)로 렌더링 통과
  return <Outlet />;
};

export default AdminLayout;