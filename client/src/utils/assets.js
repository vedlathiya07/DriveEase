import { API_BASE_URL } from "../services/api";

const placeholderSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="55%" stop-color="#155e75" />
          <stop offset="100%" stop-color="#f97316" />
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#g)" rx="32" />
      <circle cx="670" cy="110" r="88" fill="rgba(255,255,255,0.15)" />
      <circle cx="110" cy="390" r="110" fill="rgba(255,255,255,0.08)" />
      <path d="M185 317h426c19 0 34-15 34-34v-14c0-23-14-43-35-52l-56-24-53-58c-11-12-26-19-43-19H330c-17 0-33 7-44 19l-67 75-27 16c-23 13-37 37-37 63v4c0 19 15 34 34 34Z" fill="rgba(255,255,255,0.94)" />
      <circle cx="282" cy="317" r="43" fill="#0f172a" />
      <circle cx="547" cy="317" r="43" fill="#0f172a" />
      <circle cx="282" cy="317" r="19" fill="#cbd5e1" />
      <circle cx="547" cy="317" r="19" fill="#cbd5e1" />
      <path d="M283 146h159c12 0 23 5 31 14l43 46H239l27-32c4-5 10-10 17-13 7-3 14-5 21-5Z" fill="#dbeafe" />
      <text x="50%" y="88%" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.85)">DriveEase</text>
    </svg>
  `);

export const PLACEHOLDER_CAR = placeholderSvg;

export const resolveImageUrl = (path, folder = "cars") => {
  if (!path) {
    return PLACEHOLDER_CAR;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/uploads/")) {
    return `${API_BASE_URL}${path}`;
  }

  if (path.startsWith("uploads/")) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}/uploads/${folder}/${path}`;
};

export const initialsFromName = (name = "DriveEase User") =>
  name
    .split(" ")
    .map((chunk) => chunk[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
