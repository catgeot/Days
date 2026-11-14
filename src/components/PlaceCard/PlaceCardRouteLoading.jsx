import React from 'react';

export default function PlaceCardRouteLoading() {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#f4f4f5] lg:absolute lg:inset-0"
      data-testid="place-card-route-loading"
      aria-busy="true"
      aria-label="Loading place"
    >
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="h-40 w-full animate-pulse rounded-2xl bg-gray-200/80" />
        <div className="h-6 w-3/4 max-w-xs animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}