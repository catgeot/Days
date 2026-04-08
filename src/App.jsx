import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { HelmetProvider } from 'react-helmet-async';

import { supabase } from './shared/api/supabase';

import MainLayout from './shared/layout/MainLayout';
import AdminLayout from './shared/layout/AdminLayout';
import DashboardLayout from './pages/DailyReport/layout/DailyLayout';
import Home from './pages/Home';
import PlaceCard from './components/PlaceCard/index';

import Dashboard from './pages/DailyReport/Dashboard';
import Write from './pages/DailyReport/Write';
import Detail from './pages/DailyReport/Detail';
import PublicViewer from './pages/DailyReport/PublicViewer';

import { ReportProvider } from './context/ReportContext';

import Login from './shared/Auth/Login';
import Signup from './shared/Auth/SignUp';
import ForgotPassword from './shared/Auth/ForgotPassWord';
import UpdatePassword from './shared/Auth/UpdatePassword';

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
        <RouteTracker />
        <ReportProvider>
          <Analytics />
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />}>
                <Route path="place/:slug" element={<PlaceCard />} />
                <Route path="place/:slug/:tab" element={<PlaceCard />} />
                {/* Explore Routes (Modal as a child of Home) */}
                <Route path="explore" element={null} />
                <Route path="explore/:filter1" element={null} />
                <Route path="explore/:filter1/:filter2" element={null} />
              </Route>
            </Route>

            <Route path="/blog" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="write" element={<Write />} />
              <Route path="write/:id" element={<Write />} />
              <Route path=":id" element={<Detail />} />
            </Route>

            <Route path="/p/:id" element={<PublicViewer />} />

            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/update-password" element={<UpdatePassword />} />
          </Routes>
        </ReportProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
