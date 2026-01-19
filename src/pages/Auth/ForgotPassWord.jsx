import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import Logo from '../Home/components/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // 성공/실패 메시지

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Supabase 비밀번호 재설정 이메일 발송 요청
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/auth/update-password', // 이메일 클릭 시 이동할 주소
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 scale-125"><Logo /></div>
          <h2 className="text-2xl font-bold text-white/90">Reset Password</h2>
          <p className="text-sm text-gray-400 mt-2">가입하신 이메일로 재설정 링크를 보내드립니다.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-bold text-center ${message.type === 'success' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
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
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-gray-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <>링크 보내기 <Send size={18} /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/auth/login" className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors">
            <ArrowLeft size={14} /> 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;