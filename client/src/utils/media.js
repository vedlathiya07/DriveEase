import { API_BASE_URL } from "../services/api";

const uploadsBase = API_BASE_URL;
export const CAR_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80";
export const REPORT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80";

export const getStoredImageUrl = (imagePath, folder = "cars") => {
  if (!imagePath) {
    return "";
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const normalizedPath = imagePath.replace(/\\/g, "/");

  if (normalizedPath.startsWith("uploads/")) {
    return `${uploadsBase}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/uploads/")) {
    return `${uploadsBase}${normalizedPath}`;
  }

  return `${uploadsBase}/uploads/${folder}/${normalizedPath}`;
};

export const getCarImageUrl = (car) =>
  getStoredImageUrl(car?.images?.[0], "cars") || CAR_IMAGE_FALLBACK;

export const getUserAvatarUrl = (user) =>
  getStoredImageUrl(user?.avatar, "avatars");

export const getUserInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
