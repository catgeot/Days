import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { HelmetProvider } from 'react-helmet-async';

import { supabase } from './shared/api/supabase';

import MainLayout from './shared/layout/MainLayout';
import DashboardLayout from './pages/DailyReport/layout/DailyLayout';
const Home = lazy(() => import('./pages/Home'));
const PlaceCard = lazy(() => import('./components/PlaceCard/index'));
import KoreaFestivalHub from './pages/Korea';
import WorldEventsHub from './pages/WorldEvents';
import EventDetailPage from './pages/WorldEvents/EventDetailPage';
import KoreaThemeModulePage from './pages/KoreaTheme/ModulePage';
import KoreaThemeScenicPage from './pages/KoreaTheme/ScenicPage';
import KoreaThemeCoursesPage from './pages/KoreaTheme/CoursesPage';
import QaShareIndex from './pages/QaShare';
import QaShareRedirect from './pages/QaShare/QaShareRedirect';
import { isQaMooniMarkdownFixtureEnabled } from './shared/cloudPreview/isQaMooniMarkdownFixtureEnabled.js';
import { isGateoFestivalRoadEnabled } from './shared/gateoFeatureFlags.js';
import { isQaFestivalRoadFixtureEnabled } from './shared/cloudPreview/isQaFestivalRoadFixtureEnabled.js';
const MooniChatMarkdownFixturePage = isQaMooniMarkdownFixtureEnabled
  ? lazy(() => import('./pages/Qa/MooniChatMarkdownFixturePage.jsx'))
  : null;
const MooniFestivalAccessPolishFixturePage = isQaMooniMarkdownFixtureEnabled
  ? lazy(() => import('./pages/Qa/MooniFestivalAccessPolishFixturePage.jsx'))
  : null;
const galleryWriterHarnessOn = import.meta.env.VITE_GALLERY_WRITER_HARNESS === '1';
const GallerySingleWriterHarness = galleryWriterHarnessOn
  ? lazy(() => import('./pages/Qa/GallerySingleWriterHarness.jsx'))
  : null;
const festivalRoadFixtureOn =
  isQaFestivalRoadFixtureEnabled && isGateoFestivalRoadEnabled();
const FestivalRoadFixturePage = festivalRoadFixtureOn
  ? lazy(() => import('./pages/Qa/FestivalRoadFixturePage.jsx'))
  : null;
import AboutPage from './pages/AboutPage';

import Dashboard from './pages/DailyReport/Dashboard';
import Curation from './pages/DailyReport/Curation';
import Write from './pages/DailyReport/Write';
import Detail from './pages/DailyReport/Detail';
import PublicViewer from './pages/DailyReport/PublicViewer';

import { ReportProvider } from './context/ReportContext';

import Login from './shared/Auth/Login';
import Signup from './shared/Auth/SignUp';
import ForgotPassword from './shared/Auth/ForgotPassWord';
import UpdatePassword from './shared/Auth/UpdatePassword';
import AccountProfile from './shared/Auth/AccountProfile';
import GalleryAdminPage from './pages/Admin/GalleryAdminPage';
import { isPreviewDebugChromeBundled } from './shared/cloudPreview/isPreviewDebugChromeBundled.js';
import TravelAgencyVisitCapture from './components/travelAgencies/TravelAgencyVisitCapture.jsx';
const PreviewDebugChrome = isPreviewDebugChromeBundled
  ? lazy(() => import('./shared/cloudPreview/PreviewDebugChrome.jsx'))
  : null;
import { LocaleProvider } from './i18n/LocaleProvider';
import AppHistoryRecorder from './shared/navigation/AppHistoryRecorder';
import { installPersistedBlankPageReload } from './shared/lib/persistedBlankPageReload.js';
import { recordInstagramVisitIfLanding } from './pages/Korea/socialPromoInstagramSession.js';

function SocialPromoInstagramVisitCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    recordInstagramVisitIfLanding(window.sessionStorage, {
      searchParams: new URLSearchParams(window.location.search),
      referrer: document.referrer,
    });
  }, []);
  return null;
}

function PersistedBlankPageReload() {
  useEffect(() => installPersistedBlankPageReload(), []);
  return null;
}

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'G-7949KKNHRX', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}

function EnWorldEventDetailRedirect() {
  const { eventId } = useParams();
  return (
    <Navigate to={`/world-events/${encodeURIComponent(String(eventId || ''))}?lang=en`} replace />
  );
}

function App() {
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      const { pathname, search, hash } = window.location;
      if (search.includes('error') || hash.includes('access_token') || search.includes('code=')) {
        window.history.replaceState(null, '', pathname);
        console.log("URL Cleanup: Supabase 인증 확인 후 주소창이 정리되었습니다.");
      }
    });
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <LocaleProvider>
        <RouteTracker />
        <PersistedBlankPageReload />
        <SocialPromoInstagramVisitCapture />
        <AppHistoryRecorder />
        <ReportProvider>
          <Analytics />
          {PreviewDebugChrome ? (
            <Suspense fallback={null}>
              <PreviewDebugChrome />
            </Suspense>
          ) : null}
          <TravelAgencyVisitCapture />
          <Routes>
            <Route element={<MainLayout />}>
              <Route
                path="/"
                element={
                  <Suspense fallback={null}>
                    <Home />
                  </Suspense>
                }
              >
                <Route path="place/:slug" element={<PlaceCard />} />
                <Route path="place/:slug/:tab" element={<PlaceCard />} />
                {/* Explore Routes (Modal as a child of Home) */}
                <Route path="explore" element={null} />
                <Route path="explore/:filter1" element={null} />
                <Route path="explore/:filter1/:filter2" element={null} />
              </Route>
              <Route
                path="/korea/theme/top10"
                element={<Navigate to="/korea/theme/scenic" replace />}
              />
              <Route path="/korea/theme/scenic" element={<KoreaThemeScenicPage />} />
              <Route path="/korea/theme/courses" element={<KoreaThemeCoursesPage />} />
              <Route
                path="/korea/theme/regions"
                element={<Navigate to="/korea/theme/scenic" replace />}
              />
              <Route
                path="/korea/theme/packages"
                element={<Navigate to="/korea/theme/scenic" replace />}
              />
              <Route path="/korea/theme/:moduleId" element={<KoreaThemeModulePage />} />
              <Route
                path="/korea/theme"
                element={<Navigate to="/korea/theme/scenic" replace />}
              />
              <Route path="/korea" element={<KoreaFestivalHub />} />
              <Route path="/world-events" element={<WorldEventsHub />} />
              <Route path="/world-events/:eventId" element={<EventDetailPage />} />
              <Route path="/en/world-events" element={<Navigate to="/world-events?lang=en" replace />} />
              <Route path="/en/world-events/:eventId" element={<EnWorldEventDetailRedirect />} />
              {isQaMooniMarkdownFixtureEnabled && MooniChatMarkdownFixturePage ? (
                <Route path="/qa/mooni-markdown-fixture" element={<MooniChatMarkdownFixturePage />} />
              ) : null}
              {isQaMooniMarkdownFixtureEnabled && MooniFestivalAccessPolishFixturePage ? (
                <Route
                  path="/qa/mooni-festival-access-polish"
                  element={<MooniFestivalAccessPolishFixturePage />}
                />
              ) : null}
              {GallerySingleWriterHarness ? (
                <Route
                  path="/qa/gallery-single-writer"
                  element={
                    <Suspense fallback={null}>
                      <GallerySingleWriterHarness />
                    </Suspense>
                  }
                />
              ) : null}
              {festivalRoadFixtureOn && FestivalRoadFixturePage ? (
                <Route
                  path="/qa/festival-road"
                  element={
                    <Suspense fallback={null}>
                      <FestivalRoadFixturePage />
                    </Suspense>
                  }
                />
              ) : null}
              <Route path="/qa/:slug" element={<QaShareRedirect />} />
              <Route path="/qa" element={<QaShareIndex />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<Navigate to="/about" replace />} />
              <Route path="/product" element={<Navigate to="/explore" replace />} />
            </Route>

            <Route path="/blog" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="curation" element={<Curation />} />
              <Route path="write" element={<Write />} />
              <Route path="write/:id" element={<Write />} />
              <Route path=":id" element={<Detail />} />
            </Route>

            <Route path="/p/:id" element={<PublicViewer />} />
            <Route path="/blog/e/:editorialSlug" element={<PublicViewer />} />

            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/update-password" element={<UpdatePassword />} />
            <Route path="/account" element={<AccountProfile />} />
            <Route path="/admin/gallery" element={<GalleryAdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ReportProvider>
        </LocaleProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
