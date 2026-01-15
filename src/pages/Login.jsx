import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

 const handleLogin = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      // 💡 "Email not confirmed" 같은 정확한 에러 영어를 보여줍니다.
      alert("로그인 실패: " + error.message); 
    } else {
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
            onClick={() => navigate('/signup')} // ✨ 회원가입 페이지로 이동
            className="text-blue-600 font-bold hover:underline"
          >
            회원가입 하기
          </button>
        </div>
        
        <div className="mt-4 text-center border-t pt-4">
          <button onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-gray-600">
            ← 여행 페이지로 돌아가기
          </button>
        </div>

      </div>			
    </div>		
  );
};

export default Login;