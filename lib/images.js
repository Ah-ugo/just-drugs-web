// Serve smaller, modern images on slow mobile networks.
export function optimizeImage(url, width = 600) {
  if (!url) return url;
  try {
    if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !/\/upload\/[^/]*(f_auto|w_\d+)/.test(url)) {
      return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
    if (url.includes('images.unsplash.com')) {
      const u = new URL(url);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '72');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    }
  } catch { /* fall through */ }
  return url;
}
