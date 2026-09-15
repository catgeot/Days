import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Check, X } from 'lucide-react';
import Logo from '../../pages/Home/components/Logo';
import { MOBILE_INPUT_TEXT_CLASS } from '../hooks/useMobileInputViewport';
import { resetIosZoomAfterInput } from '../lib/mobileViewport';

const UpdatePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const recoveryRef = useRef(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') recoveryRef.current = true;
    });

    let cancelled = false;
    const ensureSession = async () => {
      const first = await supabase.auth.getSession();
      if (cancelled) return;
      if (first.data.session) return;
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (cancelled) return;
      const second = await supabase.auth.getSession();
      if (cancelled) return;
      if (!second.data.session) {
        navigate('/auth/login', { replace: true, state: { from: '/auth/update-password' } });
      }
    };
    void ensureSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('authPage.updatePassword.mismatch'));
      return;
    }
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      resetIosZoomAfterInput();
      if (recoveryRef.current) {
        await supabase.auth.signOut();
        navigate('/auth/login', {
          replace: true,
          state: { passwordUpdated: true },
        });
        return;
      }
      setOk(true);
      window.setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || t('authPage.updatePassword.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-gray-200 p-6 rounded-3xl shadow-2xl relative z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100/50 rounded-full transition-all z-50"
          title={t('authPage.login.backTitle')}
        >
          <X size={18} />
        </button>

        <div className="text-center mb-5">
          <div className="flex justify-center mb-2 scale-110"><Logo /></div>
          <h2 className="text-xl font-bold text-gray-900">{t('authPage.updatePassword.title')}</h2>
          <p className="text-xs text-gray-500 mt-1">{t('authPage.updatePassword.signedInSubtitle')}</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 ml-1">{t('authPage.updatePassword.newPassword')}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                className={`w-full bg-white/80 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all`}
                placeholder={t('authPage.updatePassword.placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 ml-1">{t('authPage.updatePassword.confirmPassword')}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                className={`w-full bg-white/80 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all`}
                placeholder={t('authPage.updatePassword.confirmPlaceholder')}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error ? (
            <p className="text-xs text-red-600 font-medium break-keep px-0.5">{error}</p>
          ) : null}
          {ok ? (
            <p className="text-xs text-emerald-600 font-medium break-keep px-0.5">
              {t('authPage.updatePassword.successStay')}
            </p>
          ) : null}

          <button type="submit" disabled={loading || ok} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold py-2.5 rounded-lg shadow-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>{t('authPage.updatePassword.submit')} <Check size={14} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
