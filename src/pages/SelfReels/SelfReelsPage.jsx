import { Helmet } from 'react-helmet-async';

export const SELF_REELS_EMPTY_MESSAGE = '확인할 영상이 없어요.';

export default function SelfReelsPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 text-center text-white">
      <Helmet>
        <meta name="robots" content="noindex" />
        <title>릴스</title>
      </Helmet>
      <p>{SELF_REELS_EMPTY_MESSAGE}</p>
    </main>
  );
}
