import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Check, X } from 'lucide-react';
import Logo from '../Home/components/Logo';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  // 이메일 기억하기 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 이메일 기억하기 저장/삭제 로직
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* 배경 효과 */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* 나가기 버튼 */}
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
          title="메인으로 돌아가기"
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 scale-125">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white/90">Welcome Back</h2>
          <p className="text-sm text-gray-400 mt-2">당신의 여정이 기다리고 있습니다.</p>
        </div>

        {/* 폼 시작 */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* 이메일 입력 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">EMAIL</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="email"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 ml-1">PASSWORD</label>
              {/* 비밀번호 찾기 링크 */}
              <Link to="/auth/forgot-password" class="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input
                type="password"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* 이메일 기억하기 체크박스 */}
          <div className="flex items-center gap-2 cursor-pointer group w-fit" onClick={() => setRememberEmail(!rememberEmail)}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${rememberEmail ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-600 group-hover:border-gray-400'}`}>
              {rememberEmail && <Check size={12} className="text-white" />}
            </div>
            <span className={`text-xs ${rememberEmail ? 'text-gray-300' : 'text-gray-500'} group-hover:text-gray-300 transition-colors`}>
              이메일 기억하기
            </span>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <>로그인 <ArrowRight size={18} /></>}
          </button>
        </form>
        {/* 폼 끝 */}

        {/* 회원가입 링크 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          아직 계정이 없으신가요?{' '}
          <Link to="/auth/signup" className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-colors">
            회원가입
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;