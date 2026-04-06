export const encodeId = (id) => {
  if (!id) return '';
  return btoa(id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const decodeId = (encoded) => {
  if (!encoded) return '';
  try {
    let str = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
  } catch {
    return encoded;
  }
};
