export function showToast(detail) {
  const payload =
    typeof detail === "string"
      ? { message: detail, variant: "success" }
      : detail;

  window.dispatchEvent(
    new CustomEvent("driveease:toast", {
      detail: payload,
    }),
  );
}
