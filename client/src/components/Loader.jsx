export default function Loader({ label, fullHeight = false }) {
  return (
    <div className={fullHeight ? "page-loader page-loader-full" : "page-loader"}>
      <div className="loader-orbit"></div>
      <p>{label || "Preparing your DriveEase experience..."}</p>
    </div>
  );
}
