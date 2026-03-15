import React, { useState } from 'react';
import { supabase } from '../api/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Check } from 'lucide-react';
import Logo from '../../pages/Home/components/Logo';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
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
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-gray-200 p-6 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2 scale-110"><Logo /></div>
          <h2 className="text-xl font-bold text-gray-900">New Password</h2>
          <p className="text-xs text-gray-500 mt-1">새로운 비밀번호를 입력해주세요.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 ml-1">NEW PASSWORD</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                className="w-full bg-white/80 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                placeholder="새 비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold py-2.5 rounded-lg shadow-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>변경 완료 <Check size={14} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;