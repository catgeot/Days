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

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'http://localhost:5173/', 
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
    // 🚨 [Fix] 배경 및 폰트 컬러를 다크/블랙 테마로 수정
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* 🚨 [Fix] Login.jsx와 동일한 백그라운드 효과 삽입 */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 🚨 [Fix] 글래스모피즘(Glassmorphism) 뼈대 적용 */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* 🚨 [Fix] z-50 나가기(X) 버튼 추가 */}
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
              {/* 🚨 [Fix] 다크 테마 입력 폼 스타일 적용 */}
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

          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><UserPlus size={18} /> 회원가입 완료</>}
          </button>

        </form>

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