const Booking = require("../models/Booking");
const Car = require("../models/Car");

const DAY_MS = 1000 * 60 * 60 * 24;
const VALID_DELIVERY_METHODS = ["homeDelivery", "meetUpPoint", "selfPickup"];
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toUtcDate = (year, month, day) =>
  new Date(Date.UTC(year, month - 1, day));

const parseCalendarDate = (value) => {
  if (typeof value === "string") {
    const matchedDate = value.match(DATE_ONLY_PATTERN);

    if (matchedDate) {
      const [, year, month, day] = matchedDate;
      return toUtcDate(Number(year), Number(month), Number(day));
    }
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (value instanceof Date) {
    return toUtcDate(
      parsedDate.getFullYear(),
      parsedDate.getMonth() + 1,
      parsedDate.getDate(),
    );
  }

  return toUtcDate(
    parsedDate.getUTCFullYear(),
    parsedDate.getUTCMonth() + 1,
    parsedDate.getUTCDate(),
  );
};

const getTodayDate = () => {
  const now = new Date();

  return toUtcDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
};

const isValidDate = (value) => Boolean(parseCalendarDate(value));

const listDeliveryMethods = (car) => {
  const methods = [];

  if (car.deliveryOptions?.homeDelivery) {
    methods.push("homeDelivery");
  }

  if (car.deliveryOptions?.meetUpPoint) {
    methods.push("meetUpPoint");
  }

  if (car.deliveryOptions?.selfPickup || methods.length === 0) {
    methods.push("selfPickup");
  }

  return methods;
};

const normalizeAddonSelection = (selectedAddons = [], carAddons = []) => {
  const requestedNames = selectedAddons
    .map((addon) =>
      typeof addon === "string" ? addon.trim() : addon?.name?.trim(),
    )
    .filter(Boolean);

  if (requestedNames.length === 0) {
    return [];
  }

  const catalog = new Map(
    carAddons.map((addon) => [addon.name?.trim().toLowerCase(), addon]),
  );

  return requestedNames.map((name) => {
    const matchedAddon = catalog.get(name.toLowerCase());

    if (!matchedAddon) {
      throw createHttpError(400, `Selected add-on "${name}" is not available`);
    }

    return {
      name: matchedAddon.name,
      price: matchedAddon.price,
    };
  });
};

const validateDeliveryMethod = (deliveryMethod, car) => {
  const allowedMethods = listDeliveryMethods(car);
  const normalizedMethod =
    deliveryMethod && VALID_DELIVERY_METHODS.includes(deliveryMethod)
      ? deliveryMethod
      : allowedMethods[0];

  if (!allowedMethods.includes(normalizedMethod)) {
    throw createHttpError(
      400,
      "Selected delivery method is not available for this car",
    );
  }

  return normalizedMethod;
};

const findOverlappingBooking = async (carId, startDate, endDate, ignoredId) => {
  const filter = {
    car: carId,
    status: "Booked",
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };

  if (ignoredId) {
    filter._id = { $ne: ignoredId };
  }

  return Booking.findOne(filter);
};

const createBookingCode = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DE-${timestamp}-${random}`;
};

const calculateBookingDetails = async ({
  carId,
  startDate,
  endDate,
  addons,
  deliveryMethod,
  ignoredBookingId,
}) => {
  if (!carId || !startDate || !endDate) {
    throw createHttpError(400, "Car, start date, and end date are required");
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw createHttpError(400, "Please provide valid booking dates");
  }

  const car = await Car.findById(carId);

  if (!car) {
    throw createHttpError(404, "Car not found");
  }

  if (!car.isAvailable) {
    throw createHttpError(400, "This car is currently not accepting bookings");
  }

  const normalizedStart = parseCalendarDate(startDate);
  const normalizedEnd = parseCalendarDate(endDate);
  const today = getTodayDate();

  if (normalizedStart < today) {
    throw createHttpError(400, "Bookings cannot start in the past");
  }

  if (normalizedEnd <= normalizedStart) {
    throw createHttpError(
      400,
      "Return date must be after the pickup date",
    );
  }

  const overlappingBooking = await findOverlappingBooking(
    car._id,
    normalizedStart,
    normalizedEnd,
    ignoredBookingId,
  );

  if (overlappingBooking) {
    throw createHttpError(
      409,
      "This car is already booked for the selected dates",
    );
  }

  const normalizedAddons = normalizeAddonSelection(addons, car.addons);
  const normalizedDeliveryMethod = validateDeliveryMethod(deliveryMethod, car);
  const days = Math.round((normalizedEnd - normalizedStart) / DAY_MS);
  const addonsTotal = normalizedAddons.reduce(
    (total, addon) => total + addon.price,
    0,
  );
  const totalPrice = days * car.pricePerDay + addonsTotal;

  return {
    car,
    startDate: normalizedStart,
    endDate: normalizedEnd,
    days,
    addons: normalizedAddons,
    deliveryMethod: normalizedDeliveryMethod,
    totalPrice,
  };
};

const buildBookingSummary = async (payload) => calculateBookingDetails(payload);

const getBookedRanges = async (carId) => {
  const bookings = await Booking.find({
    car: carId,
    status: "Booked",
  }).select("startDate endDate");

  return bookings.map((booking) => ({
    startDate: booking.startDate,
    endDate: booking.endDate,
  }));
};

module.exports = {
  buildBookingSummary,
  calculateBookingDetails,
  createBookingCode,
  createHttpError,
  getBookedRanges,
  listDeliveryMethods,
};
