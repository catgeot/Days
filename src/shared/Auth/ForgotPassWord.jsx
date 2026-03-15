import React, { useState } from 'react';
import { supabase } from '../api/supabase';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import Logo from '../../pages/Home/components/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // 🚨 [Fix] localhost 하드코딩 제거 (실서버 배포 시 치명적 버그 방지)
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      setMessage({ type: 'success', text: '재설정 링크를 이메일로 보냈습니다! 메일함을 확인해주세요.' });
    } catch (error) {
      setMessage({ type: 'error', text: '오류가 발생했습니다: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white/70 backdrop-blur-xl border border-gray-200 p-6 rounded-3xl shadow-xl relative z-10">

        <div className="text-center mb-5">
          <div className="flex justify-center mb-2 scale-110"><Logo /></div>
          <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-xs text-gray-500 mt-1">가입하신 이메일로 재설정 링크를 보내드립니다.</p>
        </div>

        {message && (
          <div className={`p-3 rounded-xl mb-5 text-xs font-bold text-center ${message.type === 'success' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
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
              />
            </div>
          </div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-600 border border-transparent text-white text-sm font-bold py-2.5 rounded-lg shadow-sm hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed group"
						>
						{loading ? <Loader2 size={16} className="animate-spin" /> : <>링크 보내기 <Send size={14} className="group-hover:translate-x-1 transition-transform" /></>}
					</button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/auth/login" className="text-gray-500 hover:text-gray-900 text-xs flex items-center justify-center gap-1.5 transition-colors font-medium">
            <ArrowLeft size={14} /> 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
