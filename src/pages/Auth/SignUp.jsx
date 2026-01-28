import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../src/shared/api/supabase';
import { UserPlus, Mail, Lock, Home } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ✨ 홈으로 탈출하는 함수
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
				// ✨ 중요: 이 옵션을 넣어야 메일 클릭 시 우리 사이트로 돌아옵니다.
				options: {
					emailRedirectTo: 'http://localhost:5173/', 
				},
			});

			if (error) throw error;

			// ✨ [변경] 바로 로그인 페이지로 보내지 않고, 안내 메시지 띄우기 (alert 혹은 모달)
			alert("회원가입 확인 메일을 보냈습니다! 📧\n\n이메일 함을 확인하여 링크를 클릭하면 가입이 완료됩니다.");
			
			// 안내 후 로그인 페이지로 이동
			navigate('/auth/login'); 

		} catch (error) {
			alert(error.message);
		} finally {
			setLoading(false);
		}
	};

  return (
    // ✨ bg-gray-100을 줘서 검은 배경을 덮어버립니다.
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">📝 회원가입</h1>
          <p className="text-gray-500 mt-2">나만의 일보 작성을 시작해보세요.</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                className="w-full pl-10 p-3 border rounded-lg focus:outline-blue-500 bg-gray-50"
                placeholder="email@example.com"
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
                placeholder="6자리 이상 입력해주세요"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            {loading ? '가입 처리 중...' : '회원가입 완료'}
          </button>

        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500 mb-2">이미 계정이 있으신가요?</p>
          <button 
            onClick={() => navigate('/auth/login')} 
            className="text-blue-600 font-bold hover:underline"
          >
            로그인 하러 가기
          </button>
        </div>
        
        {/* ✨ 탈출구 버튼 (Login.jsx와 동일하게 추가) */}
        <div className="mt-4 text-center border-t pt-4">
          <button 
            onClick={handleGoHome} 
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
          >
            <Home size={12} /> 여행 홈으로 돌아가기
          </button>
        </div>

      </div>      
    </div>    
  );
};

export default Signup;