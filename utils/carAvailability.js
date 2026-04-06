const mongoose = require("mongoose");

const Booking = require("../models/Booking");

const toIdStrings = (carsOrIds = []) =>
  [...new Set(
    carsOrIds
      .map((item) => String(item?._id || item || ""))
      .filter(Boolean),
  )];

const buildActiveBookingMap = async (carsOrIds) => {
  const ids = toIdStrings(carsOrIds);

  if (ids.length === 0) {
    return new Map();
  }

  const bookingSummary = await Booking.aggregate([
    {
      $match: {
        car: {
          $in: ids.map((id) => new mongoose.Types.ObjectId(id)),
        },
        status: "Booked",
      },
    },
    {
      $group: {
        _id: "$car",
        count: { $sum: 1 },
        nextStartDate: { $min: "$startDate" },
        nextEndDate: { $min: "$endDate" },
      },
    },
  ]);

  return new Map(
    bookingSummary.map((entry) => [String(entry._id), entry]),
  );
};

const deriveAvailabilityMeta = (car, bookingInfo) => {
  const activeBookingCount = bookingInfo?.count || 0;

  if (car.isAvailable === false) {
    return {
      availabilityStatus: "Unavailable",
      canBook: false,
      activeBookingCount,
      nextBookedStartDate: bookingInfo?.nextStartDate || null,
      nextBookedEndDate: bookingInfo?.nextEndDate || null,
    };
  }

  if (activeBookingCount > 0) {
    return {
      availabilityStatus: "Booked",
      canBook: true,
      activeBookingCount,
      nextBookedStartDate: bookingInfo?.nextStartDate || null,
      nextBookedEndDate: bookingInfo?.nextEndDate || null,
    };
  }

  return {
    availabilityStatus: "Available",
    canBook: true,
    activeBookingCount: 0,
    nextBookedStartDate: null,
    nextBookedEndDate: null,
  };
};

const decorateCar = (car, bookingMap) => {
  if (!car) {
    return null;
  }

  const plainCar =
    typeof car.toObject === "function" ? car.toObject() : { ...car };
  const bookingInfo = bookingMap.get(String(plainCar._id));

  return {
    ...plainCar,
    ...deriveAvailabilityMeta(plainCar, bookingInfo),
  };
};

const decorateCarsWithAvailability = async (cars) => {
  const bookingMap = await buildActiveBookingMap(cars);
  return cars.map((car) => decorateCar(car, bookingMap));
};

const decorateCarWithAvailability = async (car) => {
  if (!car) {
    return null;
  }

  const bookingMap = await buildActiveBookingMap([car]);
  return decorateCar(car, bookingMap);
};

module.exports = {
  decorateCarWithAvailability,
  decorateCarsWithAvailability,
};
