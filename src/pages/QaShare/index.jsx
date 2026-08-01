import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import SEO from '../../components/SEO';
import {
  activeCloudQaShareLinks,
  cloudQaShareUrl,
} from '../../shared/cloudPreview/cloudQaShareLinks';

export default function QaShareIndex() {
  const links = activeCloudQaShareLinks();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <SEO
        title="QA 바로가기"
        description="Cloud Preview 테스트용 짧은 링크"
        url="/qa"
      />
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-semibold tracking-wide text-slate-500">
          gateo QA
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          테스트 바로가기
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          긴 Vercel 주소 대신 아래 짧은 링크로 들어가면 됩니다. 배포가
          끝나면 목록에서 빠지거나 PROD 경로로 바뀝니다.
        </p>
        <ul className="mt-6 space-y-3">
          {links.map((link) => (
            <li key={link.slug}>
              <a
                href={cloudQaShareUrl(link.slug)}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-slate-300"
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {link.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    gateo.kr/qa/{link.slug}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-xs text-slate-500">
          <Link to="/" className="underline-offset-2 hover:underline">
            홈으로
          </Link>
        </p>
      </div>
    </main>
  );
}
