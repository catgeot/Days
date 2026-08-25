const BOT_UA =
  /googlebot|google-inspectiontool|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|whatsapp|telegrambot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|yeti|naverbot/i;

export function isCrawlerRequest(request) {
  const url = new URL(request.url);
  if (url.searchParams.get('crawler') === '1') return true;
  if (request.headers.get('x-crawler-preview') === '1') return true;
  const ua = request.headers.get('user-agent') || '';
  return BOT_UA.test(ua);
}
