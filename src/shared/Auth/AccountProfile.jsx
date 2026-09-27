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
import { PROFILE_PHOTO_LIMIT } from './profileAvatar';
import { persistProfileGallery, uploadProfilePhotoFile } from './uploadProfileAvatar';
import ProfilePhotoCount from './ProfilePhotoCount';
import ProfilePhotoLightbox from './ProfilePhotoLightbox';

const ADDABLE_PROVIDERS = ['google', 'kakao'];

function providerLabel(t, provider) {
  if (provider === 'google') return t('authPage.account.google');
  if (provider === 'kakao') return t('authPage.account.kakao');
  if (provider === 'email') return t('authPage.account.email');
  return provider;
}

const AccountProfile = ({ embedded = false, onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const account = useAccountProfile();
  const user = account.user;
  const pen = usePenName(user);
  const fileRef = useRef(null);
  const handleBlur = useDeferredViewportSyncOnBlur();
  const [photos, setPhotos] = useState([]);
  const [profilePublic, setProfilePublic] = useState(true);
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
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const photoBusyRef = useRef(false);
  const photoKey = account.photos.join('\n');
  photoBusyRef.current = photoBusy;

  useEffect(() => {
    if (embedded) return undefined;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflowX;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflowX = prevHtml;
    };
  }, [embedded]);

  useEffect(() => {
    if (photoBusyRef.current) return;
    setPhotos(account.photos);
    setProfilePublic(account.profilePublic);
  }, [photoKey, account.photos, account.profilePublic]);

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

  const close = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const saveGallery = async (nextPhotos, nextPublic) => {
    setPhotoBusy(true);
    setPhotoHint('');
    try {
      const saved = await persistProfileGallery(user, {
        photos: nextPhotos,
        profilePublic: nextPublic,
      });
      setPhotos(saved.photos);
      setProfilePublic(saved.profilePublic);
      return saved;
    } catch (error) {
      console.error(error);
      setPhotoHint(t('authPage.account.photoFail'));
      return null;
    } finally {
      setPhotoBusy(false);
    }
  };

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
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if (!files.length || !user) return;
    const room = PROFILE_PHOTO_LIMIT - photos.length;
    if (room <= 0) {
      setPhotoHint(t('authPage.account.photoLimit', { max: PROFILE_PHOTO_LIMIT }));
      return;
    }
    setPhotoBusy(true);
    setPhotoHint('');
    try {
      const added = [];
      for (const file of files.slice(0, room)) {
        added.push(await uploadProfilePhotoFile(user, file));
      }
      const saved = await persistProfileGallery(user, {
        photos: [...added, ...photos],
        profilePublic,
      });
      setPhotos(saved.photos);
      setProfilePublic(saved.profilePublic);
      setPhotoHint(t('authPage.account.photoUpdated'));
      if (files.length > room) {
        setPhotoHint(t('authPage.account.photoLimit', { max: PROFILE_PHOTO_LIMIT }));
      }
    } catch (error) {
      console.error(error);
      setPhotoHint(t('authPage.account.photoFail'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = (url) => {
    void saveGallery(photos.filter((item) => item !== url), profilePublic);
  };

  const setCover = (url) => {
    if (photos[0] === url) return;
    void saveGallery([url, ...photos.filter((item) => item !== url)], profilePublic);
  };

  const togglePublic = () => {
    const next = !profilePublic;
    setProfilePublic(next);
    void saveGallery(photos, next).then((saved) => {
      if (saved) setPhotoHint(t('authPage.account.publicSaved'));
      else setProfilePublic(!next);
    });
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
  const cover = photos[0] || '';
  const atLimit = photos.length >= PROFILE_PHOTO_LIMIT;

  return (
    <div className={embedded
      ? 'flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#0a0a0a]'
      : 'fixed inset-0 z-[150] flex flex-col overflow-hidden bg-slate-800'}
    >
      {!embedded ? (
        <>
          <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[100px]" />
        </>
      ) : null}

      {/* overflow-y auto alone computes overflow-x to auto, so wide blur orbs roll the page sideways and trap the scroll */}
      <div className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        {embedded ? (
          <div className="pointer-events-auto sticky top-0 z-30 flex justify-end bg-[#0a0a0a]/95 px-2 py-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={close}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 text-gray-400 touch-manipulation hover:bg-white/5 hover:text-white active:opacity-80"
              title={t('authPage.login.backTitle')}
              aria-label={t('authPage.login.backTitle')}
            >
              <X size={20} />
            </button>
          </div>
        ) : null}
        <div className={`mx-auto w-full max-w-sm ${embedded ? 'px-4 pb-10' : 'p-4 py-6 pb-16'}`}>
          <div className="relative w-full max-w-full rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
            {embedded ? null : (
              <button
                type="button"
                onClick={close}
                className="absolute top-2 right-2 z-30 flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-400 touch-manipulation transition-all hover:bg-gray-100/50 hover:text-gray-800 active:opacity-80"
                title={t('authPage.login.backTitle')}
                aria-label={t('authPage.login.backTitle')}
              >
                <X size={20} />
              </button>
            )}

            <div className="mb-5 text-center">
              {embedded ? null : (
                <div className="mb-2 flex scale-110 justify-center"><Logo /></div>
              )}
              <h1 className="text-xl font-bold text-gray-900">{t('authPage.account.title')}</h1>
              <p className="mt-1 break-keep text-xs text-gray-500">{t('authPage.account.subtitle')}</p>
            </div>

            {!user ? (
              <div className="space-y-4 text-center">
                <p className="break-keep text-sm text-gray-600">{t('authPage.account.needLogin')}</p>
                <Link
                  to="/auth/login"
                  state={{ from: '/account' }}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
                >
                  {t('logbook.common.loginAction')}
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <section className="flex flex-col items-center text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (cover) setPhotoViewerOpen(true);
                      else fileRef.current?.click();
                    }}
                    disabled={photoBusy}
                    className="relative aspect-[5/4] max-h-72 w-full overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 touch-manipulation"
                    aria-label={cover ? t('authPage.account.viewPhoto', { name: previewName }) : t('authPage.account.changePhoto')}
                  >
                    {cover ? (
                      <img src={cover} alt="" className="pointer-events-none h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-gray-400">
                        <Camera size={36} />
                      </span>
                    )}
                    {cover ? (
                      <span className="pointer-events-none absolute top-2 right-2">
                        <ProfilePhotoCount count={photos.length} />
                      </span>
                    ) : null}
                  </button>
                  {photos.length > 1 ? (
                    <ul className="mt-3 flex w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain px-1 pt-1 pb-1">
                      {photos.map((url) => (
                        <li key={url} className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setCover(url)}
                            title={t('authPage.account.setCover')}
                            className={`h-14 w-14 overflow-hidden rounded-lg border ${url === cover ? 'border-blue-500' : 'border-gray-200'}`}
                          >
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePhoto(url)}
                            disabled={photoBusy}
                            aria-label={t('authPage.account.removePhoto')}
                            className="absolute -right-1 -top-1 rounded-full border border-gray-200 bg-white p-0.5 text-gray-500 hover:text-gray-800"
                          >
                            <X size={10} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={photoBusy || atLimit}
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-500 disabled:opacity-50"
                  >
                    {photoBusy ? '…' : t('authPage.account.changePhoto')}
                  </button>
                  <p className="mt-2 break-keep text-[10px] leading-snug text-gray-400">{t('authPage.account.photoHint')}</p>
                  {atLimit ? (
                    <p className="mt-1 text-[10px] font-bold text-gray-500">{t('authPage.account.photoLimit', { max: PROFILE_PHOTO_LIMIT })}</p>
                  ) : null}
                  {photoHint ? <p className="mt-1 text-[10px] font-bold text-emerald-600">{photoHint}</p> : null}
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhoto} />
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profilePublic}
                    disabled={photoBusy}
                    onClick={togglePublic}
                    className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-gray-800">{t('authPage.account.publicLabel')}</span>
                      <span className="mt-0.5 block break-keep text-[10px] leading-snug text-gray-400">
                        {profilePublic ? t('authPage.account.publicOn') : t('authPage.account.publicOff')}
                      </span>
                    </span>
                    <span className={`relative h-6 w-11 shrink-0 rounded-full ${profilePublic ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${profilePublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </span>
                  </button>
                </section>

                <section className="space-y-2 border-t border-gray-100 pt-5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                      className={`min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200`}
                    />
                    <button
                      type="button"
                      onClick={savePenName}
                      disabled={pen.loading || pen.saving}
                      className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {pen.saving ? '…' : t('authPage.account.save')}
                    </button>
                  </div>
                  <p className="break-keep text-[10px] leading-snug text-gray-400">
                    {previewName ? t('authPage.account.penNameHint') : t('logbook.profile.penNameHint')}
                  </p>
                  {penHint ? <p className="text-[10px] font-bold text-emerald-600">{penHint}</p> : null}
                </section>

                <section className="space-y-3 border-t border-gray-100 pt-5">
                  <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                      className={`w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2.5 ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 outline-none placeholder:text-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400`}
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder={t('authPage.updatePassword.confirmPlaceholder')}
                      className={`w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2.5 ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 outline-none placeholder:text-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400`}
                    />
                    {passwordError ? <p className="break-keep text-xs font-medium text-red-600">{passwordError}</p> : null}
                    {passwordOk ? <p className="break-keep text-xs font-medium text-emerald-600">{t('authPage.updatePassword.successStay')}</p> : null}
                    <button
                      type="submit"
                      disabled={passwordBusy}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {passwordBusy ? <Loader2 size={16} className="animate-spin" /> : <>{t('authPage.updatePassword.submit')} <Check size={14} /></>}
                    </button>
                  </form>
                </section>

                <section className="space-y-3 border-t border-gray-100 pt-5">
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t('authPage.account.accounts')}</h2>
                  <p className="break-keep text-[10px] leading-snug text-gray-400">{t('authPage.account.accountsHint')}</p>
                  <ul className="space-y-1.5">
                    {(identities.length ? identities : [{ provider: user.app_metadata?.provider || 'email', identity_id: 'current' }]).map((row) => (
                      <li key={row.identity_id || row.provider} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700">
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
                        className="rounded-lg border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {linkBusy === provider ? '…' : t('authPage.account.addProvider', { name: providerLabel(t, provider) })}
                      </button>
                    ))}
                  </div>
                  {linkError ? <p className="break-keep text-xs font-medium text-red-600">{linkError}</p> : null}
                  <p className="truncate text-[11px] text-gray-400">{user.email}</p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
      {photoViewerOpen && cover ? (
        <ProfilePhotoLightbox
          src={cover}
          photos={photos}
          name={previewName}
          onClose={() => setPhotoViewerOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default AccountProfile;
