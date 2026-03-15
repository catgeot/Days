// src/shared/Auth/Login.jsx
// 🚨 [Fix] 나가기 버튼에 z-50 강제 부여로 마우스 호버 가로챔 버그 해결

import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Check, X } from 'lucide-react';
import Logo from '../../pages/Home/components/Logo';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (rememberEmail) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/'); 
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* 배경 효과 */}
      <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-gray-200 p-6 rounded-3xl shadow-2xl relative z-10">
        
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100/50 rounded-full transition-all z-50"
          title="메인으로 돌아가기"
        >
          <X size={18} />
        </button>

        {/* 헤더 */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2 scale-110">
            <Logo />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Welcome Back</h2>
          <p className="text-xs text-gray-500 mt-1">당신의 여정이 기다리고 있습니다.</p>
        </div>

        {/* 폼 시작 */}
        <form onSubmit={handleLogin} className="space-y-3">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 ml-1">EMAIL</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="email"
                required
                className="w-full bg-white/80 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-gray-500 ml-1">PASSWORD</label>
              <Link to="/auth/forgot-password" className="text-[10px] text-blue-500 hover:text-blue-600 transition-colors">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                className="w-full bg-white/80 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 cursor-pointer group w-fit" onClick={() => setRememberEmail(!rememberEmail)}>
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${rememberEmail ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}>
              {rememberEmail && <Check size={10} className="text-white" />}
            </div>
            <span className={`text-[10px] ${rememberEmail ? 'text-gray-700' : 'text-gray-500'} group-hover:text-gray-700 transition-colors`}>
              이메일 기억하기
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 border border-transparent text-white text-sm font-bold py-2.5 rounded-lg shadow-sm hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2 group"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>로그인 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4 opacity-60">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-[10px] text-gray-500 font-bold tracking-widest">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button" 
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-lg hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
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
            className="w-full bg-[#FEE500]/10 border border-[#FEE500]/50 text-gray-800 text-xs font-bold py-2.5 rounded-lg hover:bg-[#FEE500]/20 hover:shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3c-5.52 0-10 3.5-10 7.8 0 2.78 1.81 5.2 4.54 6.54L5.3 21.6c-.14.49.4.9.83.6l4.2-2.8c.54.08 1.1.13 1.67.13 5.52 0 10-3.5 10-7.8S17.52 3 12 3z" fill="#3C1E1E"/>
            </svg>
            Kakao
          </button>
        </div>

        {/* 회원가입 링크 */}
        <div className="mt-5 text-center text-xs text-gray-500">
          아직 계정이 없으신가요?{' '}
          <Link to="/auth/signup" className="text-blue-500 hover:text-blue-600 font-bold hover:underline transition-colors">
            회원가입
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;