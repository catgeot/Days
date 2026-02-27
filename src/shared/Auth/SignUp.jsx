// src/shared/Auth/SignUp.jsx
// 🚨 [Fix] Login.jsx와 동일한 Dark & Glassmorphism 디자인으로 UI 통일 적용 및 z-50 나가기 버튼 구현

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { UserPlus, Mail, Lock, X, Loader2 } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin, 
        },
      });

      if (error) throw error;

      alert("회원가입 확인 메일을 보냈습니다! 📧\n\n이메일 함을 확인하여 링크를 클릭하면 가입이 완료됩니다.");
      navigate('/auth/login'); 

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        
        <button 
          onClick={handleGoHome} 
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
          title="메인으로 돌아가기"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white/90">📝 회원가입</h1>
          <p className="text-sm text-gray-400 mt-2">나만의 일보 작성을 시작해보세요.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">이메일</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input 
                type="email" 
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">비밀번호</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input 
                type="password" 
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                placeholder="6자리 이상 입력해주세요"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* 🚨 [Fix] 기본 버튼 디자인 리팩토링 (다크 글래스 + 퍼플 네온 호버) */}
          <button 
            disabled={loading}
            className="w-full bg-black/40 border border-white/10 text-white font-bold py-4 rounded-xl backdrop-blur-md hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 group"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><UserPlus size={18} className="group-hover:scale-110 transition-transform" /> 회원가입 완료</>}
          </button>

        </form>

        <div className="flex items-center gap-4 my-6 opacity-50">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="text-xs text-gray-500 font-bold tracking-widest">OR</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* 🚨 [New] 소셜 가입 컴팩트 가로 배치 & 오리지널 로고 & 브랜드 글로우 */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button" 
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="w-full bg-black/40 border border-white/10 text-white text-sm font-bold py-3.5 rounded-xl backdrop-blur-md hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSocialLogin('kakao')}
            disabled={loading}
            className="w-full bg-black/40 border border-white/10 text-white text-sm font-bold py-3.5 rounded-xl backdrop-blur-md hover:border-[#FEE500]/50 hover:shadow-[0_0_15px_rgba(254,229,0,0.2)] hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3c-5.52 0-10 3.5-10 7.8 0 2.78 1.81 5.2 4.54 6.54L5.3 21.6c-.14.49.4.9.83.6l4.2-2.8c.54.08 1.1.13 1.67.13 5.52 0 10-3.5 10-7.8S17.52 3 12 3z" fill="#FEE500"/>
            </svg>
            Kakao
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/auth/login" className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-colors">
            로그인 하러 가기
          </Link>
        </div>

      </div>      
    </div>    
  );
};

export default Signup;