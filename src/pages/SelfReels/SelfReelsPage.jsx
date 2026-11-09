import { Helmet } from 'react-helmet-async';
import { isGateoSelfReelsFixtureEnabled } from '../../shared/gateoFeatureFlags.js';
import { getPublishedSelfReels } from './selfReelsCatalog.js';
import { getFixtureSelfReels } from './selfReelsFixture.js';
import SelfReelsFeed from './SelfReelsFeed.jsx';

export const SELF_REELS_EMPTY_MESSAGE = '확인할 영상이 없어요.';

function resolveSelfReels() {
  if (isGateoSelfReelsFixtureEnabled()) return getFixtureSelfReels();
  return getPublishedSelfReels();
}

export default function SelfReelsPage() {
  const reels = resolveSelfReels();

  return (
    <main className="absolute inset-0 z-10 flex flex-col bg-black text-white">
      <Helmet>
        <meta name="robots" content="noindex" />
        <title>릴스</title>
      </Helmet>
      {reels.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p>{SELF_REELS_EMPTY_MESSAGE}</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <SelfReelsFeed reels={reels} />
        </div>
      )}
    </main>
  );
}
