import React, { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import SEO from '../../components/SEO';
import { resolveCloudQaShareLink } from '../../shared/cloudPreview/cloudQaShareLinks';

export default function QaShareRedirect() {
  const { slug } = useParams();
  const link = resolveCloudQaShareLink(slug);

  useEffect(() => {
    if (!link?.destination) return undefined;
    window.location.replace(link.destination);
    return undefined;
  }, [link]);

  if (!link) {
    return <Navigate to="/qa" replace />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 text-stone-800">
      <SEO
        title={`${link.label} QA`}
        description="Cloud Preview로 이동합니다"
        url={`/qa/${link.slug}`}
      />
      <p className="text-sm font-semibold break-keep">
        {link.label} Preview로 이동 중…
      </p>
      <a
        href={link.destination}
        className="mt-3 text-sm font-medium text-amber-800 underline underline-offset-2"
      >
        바로가기
      </a>
      <Link
        to="/qa"
        className="mt-6 text-xs text-stone-500 underline-offset-2 hover:underline"
      >
        QA 목록
      </Link>
    </main>
  );
}
