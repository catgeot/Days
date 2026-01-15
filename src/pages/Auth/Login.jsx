import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Home } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

// ✨ [수정 1] 모호한 '뒤로가기(-1)' 대신 확실한 '홈으로(/)' 이동으로 변경!  const handleGoBack = () => {
	const handleGoBack = () => {
    navigate('/'); 
  };

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      alert("로그인 실패: " + error.message); 
    } else {
      // ✨ [수정 포인트 2] 로그인이 성공하면 바로 '일보 대시보드'로 이동
      navigate('/report'); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">🔐 일보 시스템</h1>
          <p className="text-gray-500 mt-2">관리자 계정으로 로그인하세요.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="email" 
                name="email" 
                autoComplete="email" 
                required
                className="w-full pl-10 p-3 border rounded-lg focus:outline-blue-500 bg-gray-50"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                required
                className="w-full pl-10 p-3 border rounded-lg focus:outline-blue-500 bg-gray-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? '로그인 중...' : '로그인 하기'}
          </button>

        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500 mb-2">아직 계정이 없으신가요?</p>
          <button 
            // ✨ 혹시 폴더 정리를 안 하셨다면 '/signup'으로 수정하세요
            onClick={() => navigate('/auth/signup')} 
            className="text-blue-600 font-bold hover:underline"
          >
            회원가입 하기
          </button>
        </div>
        
        <div className="mt-4 text-center border-t pt-4">
          {/* ✨ [수정 2] 버튼 설명도 명확하게 바꿉니다 */}
          <button 
            onClick={handleGoBack} 
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
          >
            <Home size={12} /> 여행 홈으로 돌아가기
          </button>
        </div>

      </div>      
    </div>    
  );
};

export default Login;