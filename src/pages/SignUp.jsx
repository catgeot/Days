import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, UserPlus } from 'lucide-react';

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Supabase 회원가입 요청
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      alert("가입 실패: " + error.message);
    } else {
      alert("가입 성공! 🎉 이메일 인증 메일이 발송되었을 수 있습니다. (설정에 따라 자동 로그인됨)");
      // 자동 로그인 설정이 되어있다면 바로 메인으로
      navigate('/report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">🚀 회원가입</h1>
          <p className="text-gray-500 mt-2">나만의 일보 시스템을 시작하세요.</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                className="w-full pl-10 p-3 border rounded-lg focus:outline-blue-500 bg-gray-50"
                placeholder="user@example.com"
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
                placeholder="6자리 이상 입력"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="bg-green-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            {loading ? '가입 처리 중...' : '계정 만들기'}
          </button>

        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            로그인하기
          </Link>
        </div>

      </div>
    </div>
  );
};

export default SignUp;