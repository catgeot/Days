import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Check, Loader2, Lock, UserRoundPen, X } from 'lucide-react';
import Logo from '../../pages/Home/components/Logo';
import { supabase } from '../api/supabase';
import { MOBILE_INPUT_TEXT_CLASS, useDeferredViewportSyncOnBlur } from '../hooks/useMobileInputViewport';
import { resetIosZoomAfterInput } from '../lib/mobileViewport';
import { usePenName } from '../../pages/DailyReport/hooks/usePenName';
import { useAccountProfile } from './useAccountProfile';
import { uploadProfileAvatar } from './uploadProfileAvatar';

const ADDABLE_PROVIDERS = ['google', 'kakao'];

function providerLabel(t, provider) {
  if (provider === 'google') return t('authPage.account.google');
  if (provider === 'kakao') return t('authPage.account.kakao');
  if (provider === 'email') return t('authPage.account.email');
  return provider;
}

const AccountProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const account = useAccountProfile();
  const user = account.user;
  const pen = usePenName(user);
  const fileRef = useRef(null);
  const handleBlur = useDeferredViewportSyncOnBlur();
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoHint, setPhotoHint] = useState('');
  const [penHint, setPenHint] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordOk, setPasswordOk] = useState(false);
  const [identities, setIdentities] = useState([]);
  const [identitiesReady, setIdentitiesReady] = useState(false);
  const [linkBusy, setLinkBusy] = useState('');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    setPhotoUrl(account.avatarUrl);
  }, [account.avatarUrl]);

  useEffect(() => {
    if (!user?.id) {
      setIdentities([]);
      setIdentitiesReady(false);
      return undefined;
    }
    let cancelled = false;
    setIdentitiesReady(false);
    supabase.auth.getUserIdentities().then(({ data, error }) => {
      if (cancelled) return;
      if (!error) setIdentities(data?.identities || []);
      setIdentitiesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const savePenName = async () => {
    setPenHint('');
    const { ok } = await pen.save();
    if (!ok) {
      setPenHint(t('authPage.account.saveFail'));
      return;
    }
    setPenHint(t('authPage.account.saved'));
  };

  const onPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;
    setPhotoBusy(true);
    setPhotoHint('');
    try {
      const url = await uploadProfileAvatar(user, file);
      setPhotoUrl(url);
      setPhotoHint(t('authPage.account.photoUpdated'));
    } catch (error) {
      console.error(error);
      setPhotoHint(t('authPage.account.photoFail'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordOk(false);
    if (password !== confirm) {
      setPasswordError(t('authPage.updatePassword.mismatch'));
      return;
    }
    setPasswordBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      resetIosZoomAfterInput();
      setPassword('');
      setConfirm('');
      setPasswordOk(true);
    } catch (error) {
      setPasswordError(error.message || t('authPage.updatePassword.fail'));
    } finally {
      setPasswordBusy(false);
    }
  };

  const linkProvider = async (provider) => {
    setLinkError('');
    setLinkBusy(provider);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo: `${window.location.origin}/account` },
      });
      if (error) throw error;
    } catch (error) {
      setLinkError(error.message || t('authPage.account.linkFail'));
      setLinkBusy('');
    }
  };

  const linked = new Set(identities.map((row) => row.provider));
  const previewName = pen.displayName.trim() || account.label;

  return (
    <div className="min-h-screen bg-slate-800 overflow-y-auto flex items-start justify-center p-4 font-sans relative">
      <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-gray-200 p-6 rounded-3xl shadow-2xl relative z-10 my-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100/50 rounded-full transition-all"
          title={t('authPage.login.backTitle')}
        >
          <X size={18} />
        </button>

        <div className="text-center mb-5">
          <div className="flex justify-center mb-2 scale-110"><Logo /></div>
          <h1 className="text-xl font-bold text-gray-900">{t('authPage.account.title')}</h1>
          <p className="text-xs text-gray-500 mt-1 break-keep">{t('authPage.account.subtitle')}</p>
        </div>

        {!user ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600 break-keep">{t('authPage.account.needLogin')}</p>
            <Link
              to="/auth/login"
              state={{ from: '/account' }}
              className="inline-flex w-full items-center justify-center bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-blue-500"
            >
              {t('logbook.common.loginAction')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200"
                aria-label={t('authPage.account.changePhoto')}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera size={22} />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                {photoBusy ? '…' : t('authPage.account.changePhoto')}
              </button>
              <p className="text-[10px] text-gray-400 mt-2 leading-snug break-keep">{t('authPage.account.photoHint')}</p>
              {photoHint ? <p className="text-[10px] font-bold text-emerald-600 mt-1">{photoHint}</p> : null}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </section>

            <section className="space-y-2 border-t border-gray-100 pt-5">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <UserRoundPen size={12} className="text-blue-500" />
                {t('authPage.account.penName')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pen.displayName}
                  onChange={(e) => pen.setDisplayName(e.target.value.slice(0, pen.maxLen))}
                  onBlur={handleBlur}
                  disabled={pen.loading}
                  placeholder={user.email?.split('@')[0] || t('logbook.profile.nicknamePlaceholder')}
                  maxLength={pen.maxLen}
                  autoComplete="nickname"
                  className={`flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-2.5 py-2 ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200`}
                />
                <button
                  type="button"
                  onClick={savePenName}
                  disabled={pen.loading || pen.saving}
                  className="shrink-0 px-3 py-2 text-[11px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                >
                  {pen.saving ? '…' : t('authPage.account.save')}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 leading-snug break-keep">
                {previewName ? t('authPage.account.penNameHint') : t('logbook.profile.penNameHint')}
              </p>
              {penHint ? <p className="text-[10px] font-bold text-emerald-600">{penHint}</p> : null}
            </section>

            <section className="space-y-3 border-t border-gray-100 pt-5">
              <h2 className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <Lock size={12} className="text-purple-500" />
                {t('authPage.account.password')}
              </h2>
              <form onSubmit={onPassword} className="space-y-3">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder={t('authPage.updatePassword.placeholder')}
                  className={`w-full bg-white/80 border border-gray-200 rounded-lg py-2.5 px-3 ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400`}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder={t('authPage.updatePassword.confirmPlaceholder')}
                  className={`w-full bg-white/80 border border-gray-200 rounded-lg py-2.5 px-3 ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400`}
                />
                {passwordError ? <p className="text-xs text-red-600 font-medium break-keep">{passwordError}</p> : null}
                {passwordOk ? <p className="text-xs text-emerald-600 font-medium break-keep">{t('authPage.updatePassword.successStay')}</p> : null}
                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {passwordBusy ? <Loader2 size={16} className="animate-spin" /> : <>{t('authPage.updatePassword.submit')} <Check size={14} /></>}
                </button>
              </form>
            </section>

            <section className="space-y-3 border-t border-gray-100 pt-5">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('authPage.account.accounts')}</h2>
              <p className="text-[10px] text-gray-400 leading-snug break-keep">{t('authPage.account.accountsHint')}</p>
              <ul className="space-y-1.5">
                {(identities.length ? identities : [{ provider: user.app_metadata?.provider || 'email', identity_id: 'current' }]).map((row) => (
                  <li key={row.identity_id || row.provider} className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <span className="font-semibold">{providerLabel(t, row.provider)}</span>
                    <span className="text-[10px] font-bold text-emerald-600">{t('authPage.account.connected')}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                {identitiesReady && ADDABLE_PROVIDERS.filter((provider) => !linked.has(provider)).map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    disabled={Boolean(linkBusy)}
                    onClick={() => linkProvider(provider)}
                    className="text-xs font-bold py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {linkBusy === provider ? '…' : t('authPage.account.addProvider', { name: providerLabel(t, provider) })}
                  </button>
                ))}
              </div>
              {linkError ? <p className="text-xs text-red-600 font-medium break-keep">{linkError}</p> : null}
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountProfile;
