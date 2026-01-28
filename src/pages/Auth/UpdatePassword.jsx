import React, { useState } from 'react';
import { supabase } from '../../../src/shared/api/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Check } from 'lucide-react';
import Logo from '../Home/components/Logo';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Supabase 유저 정보 업데이트 (비밀번호 변경)
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      alert('비밀번호가 성공적으로 변경되었습니다! 다시 로그인해주세요.');
      navigate('/auth/login');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 scale-125"><Logo /></div>
          <h2 className="text-2xl font-bold text-white/90">New Password</h2>
          <p className="text-sm text-gray-400 mt-2">새로운 비밀번호를 입력해주세요.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">NEW PASSWORD</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                placeholder="새 비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <>변경 완료 <Check size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;