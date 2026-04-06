export default function SafeImage({ src, fallback, alt, ...props }) {
  return (
    <img
      key={src || fallback}
      {...props}
      src={src || fallback}
      alt={alt}
      onError={(event) => {
        if (event.currentTarget.src !== fallback) {
          event.currentTarget.src = fallback;
        }
      }}
    />
  );
}
