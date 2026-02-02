const SHOPEE_DOMAINS = ['shopee.vn', 'vn.shp.ee', 's.shopee.vn'];

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'aff_source',
  'aff_sub',
  'aff_sub2',
  'aff_sub3',
  'aff_sub4',
  'aff_sub5'
];

export function isShopeeUrl(urlString) {
  try {
    const url = new URL(urlString);
    return SHOPEE_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function normalizeUrl(urlString) {
  const url = new URL(urlString);

  // Remove tracking params
  TRACKING_PARAMS.forEach((param) => {
    url.searchParams.delete(param);
  });

  // Sort params for stable representation
  const params = new URLSearchParams(url.searchParams);
  const sorted = new URLSearchParams();
  Array.from(params.keys())
    .sort()
    .forEach((key) => {
      const values = params.getAll(key);
      values.forEach((v) => sorted.append(key, v));
    });

  url.search = sorted.toString();

  return url.toString();
}

export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    undefined
  );
}

