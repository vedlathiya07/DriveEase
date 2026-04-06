export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(Number(value || 0));

export const formatDate = (value, options = {}) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));

export const formatDateRange = (startDate, endDate) =>
  `${formatDate(startDate)} - ${formatDate(endDate)}`;

export const calculateInclusiveDays = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
};

export const formatRole = (role) => {
  if (role === "owner") {
    return "Fleet Owner";
  }

  if (role === "admin") {
    return "Administrator";
  }

  return "Customer";
};
