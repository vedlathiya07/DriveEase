const Booking = require("../models/Booking");
const User = require("../models/User");
const sendEmail = require("./sendEmail");
const { createBookingCode } = require("./booking");

const hydrateBooking = (bookingId) =>
  Booking.findById(bookingId)
    .populate({
      path: "car",
      populate: {
        path: "owner",
        select: "name email",
      },
    })
    .populate("user", "name email");

const createBookingFromPaymentSession = async (session) => {
  if (session.booking) {
    return hydrateBooking(session.booking);
  }

  const booking = await Booking.create({
    user: session.user,
    car: session.car,
    startDate: session.startDate,
    endDate: session.endDate,
    totalPrice: session.amount,
    bookingCode: createBookingCode(),
    addons: session.addons || [],
    deliveryMethod: session.deliveryMethod,
    status: "Booked",
    payment: {
      provider: "dummy",
      sessionId: session.sessionId,
      orderId: session.orderId,
      transactionId: session.transactionId,
      method: session.paymentMethod,
      status: "paid",
      amount: session.amount,
      paidAt: session.paidAt || new Date(),
    },
  });

  session.booking = booking._id;
  session.status = "consumed";
  await session.save();

  const user = await User.findById(session.user);
  const hydratedBooking = await hydrateBooking(booking._id);
  const car = hydratedBooking?.car;

  if (user?.email && car) {
    sendEmail(
      user.email,
      "DriveEase booking confirmed",
      [
        `Hello ${user.name},`,
        "",
        "Your booking is confirmed.",
        `Booking code: ${booking.bookingCode}`,
        `Car: ${car.title}`,
        `Location: ${car.location}`,
        `Dates: ${new Date(booking.startDate).toDateString()} to ${new Date(
          booking.endDate,
        ).toDateString()}`,
        `Total paid: Rs. ${booking.totalPrice}`,
        "",
        "Thank you for choosing DriveEase.",
      ].join("\n"),
    );
  }

  return hydratedBooking;
};

module.exports = {
  createBookingFromPaymentSession,
  hydrateBooking,
};
