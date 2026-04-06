export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatShortDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatDateRange = (startDate, endDate) =>
  `${formatShortDate(startDate)} to ${formatShortDate(endDate)}`;

export const formatDeliveryMethod = (method) => {
  if (method === "homeDelivery") {
    return "Home delivery";
  }

  if (method === "meetUpPoint") {
    return "Meet-up point";
  }

  if (method === "selfPickup") {
    return "Self pickup";
  }

  return "Flexible pickup";
};

export const calculateDayCount = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 0;
  }

  const oneDay = 1000 * 60 * 60 * 24;
  const normalizedStart = new Date(startDate);
  const normalizedEnd = new Date(endDate);

  normalizedStart.setHours(0, 0, 0, 0);
  normalizedEnd.setHours(0, 0, 0, 0);

  return Math.max(0, Math.round((normalizedEnd - normalizedStart) / oneDay));
};
