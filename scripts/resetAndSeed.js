require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Car = require("../models/Car");
const PaymentSession = require("../models/PaymentSession");
const User = require("../models/User");
const { resolveLocationCoords } = require("../utils/geocode");

const dayMs = 1000 * 60 * 60 * 24;

const createUtcDate = (offsetDays) => {
  const today = new Date();

  return new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + offsetDays,
    ),
  );
};

const createCarSeed = async (ownerId, overrides = {}) => {
  const location = overrides.location || "Vadodara";
  const coords = await resolveLocationCoords(location);

  if (!coords) {
    throw new Error(`Unable to resolve coordinates for seeded location: ${location}`);
  }

  return {
    brand: "Premium",
    category: "Premium",
    year: 2024,
    fuelType: "Petrol",
    images: [],
    specs: {
      seats: 5,
      transmission: "Automatic",
      mileage: "18 km/l",
    },
    addons: [
      { name: "Airport pickup", price: 900 },
      { name: "Wi-Fi hotspot", price: 450 },
    ],
    deliveryOptions: {
      homeDelivery: true,
      selfPickup: true,
      meetUpPoint: `${location} City Center`,
    },
    location,
    locationCoords: {
      lat: coords.lat,
      lng: coords.lng,
    },
    owner: ownerId,
    isAvailable: true,
    ...overrides,
  };
};

async function run() {
  if (!process.env.DB_URL) {
    throw new Error("DB_URL is required in the environment before seeding.");
  }

  await mongoose.connect(process.env.DB_URL);

  await Promise.all([
    PaymentSession.deleteMany({}),
    Booking.deleteMany({}),
    Car.deleteMany({}),
    User.deleteMany({}),
  ]);

  const hashedPasswords = {
    admin: await bcrypt.hash("Admin@123", 10),
    owner: await bcrypt.hash("Owner@123", 10),
    user: await bcrypt.hash("User@123", 10),
  };

  const [admin, owner, customer, secondCustomer] = await User.create([
    {
      name: "DriveEase Admin",
      email: "admin@driveease.demo",
      password: hashedPasswords.admin,
      phone: "+91 90000 00001",
      role: "admin",
    },
    {
      name: "Ved Lathiya",
      email: "owner@driveease.demo",
      password: hashedPasswords.owner,
      phone: "+91 90000 00002",
      role: "owner",
    },
    {
      name: "Aarav Shah",
      email: "customer@driveease.demo",
      password: hashedPasswords.user,
      phone: "+91 90000 00003",
      role: "user",
    },
    {
      name: "Riya Patel",
      email: "riya@driveease.demo",
      password: hashedPasswords.user,
      phone: "+91 90000 00004",
      role: "user",
    },
  ]);

  const seededCars = await Car.create([
    await createCarSeed(owner._id, {
      title: "Kia Seltos X-Line",
      brand: "Kia",
      category: "SUV",
      year: 2024,
      description:
        "A polished city-and-highway SUV with premium interiors, smooth automatic driving, and confident road presence.",
      pricePerDay: 4200,
      location: "Vadodara",
      fuelType: "Petrol",
      images: [
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1400&q=80",
      ],
      specs: {
        seats: 5,
        transmission: "Automatic",
        mileage: "17 km/l",
      },
      addons: [
        { name: "Airport pickup", price: 900 },
        { name: "Child seat", price: 550 },
      ],
      deliveryOptions: {
        homeDelivery: true,
        selfPickup: true,
        meetUpPoint: "Vadodara Railway Station",
      },
    }),
    await createCarSeed(owner._id, {
      title: "Mahindra XUV700 AX7",
      brand: "Mahindra",
      category: "Family SUV",
      year: 2023,
      description:
        "A roomy premium SUV prepared for long drives, business travel, and comfortable family bookings.",
      pricePerDay: 5100,
      location: "Ahmedabad",
      fuelType: "Diesel",
      images: [
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80",
      ],
      specs: {
        seats: 7,
        transmission: "Automatic",
        mileage: "15 km/l",
      },
    }),
    await createCarSeed(owner._id, {
      title: "Tata Nexon EV Max",
      brand: "Tata",
      category: "Electric",
      year: 2024,
      description:
        "An easy-to-present EV option with quiet performance, clean styling, and practical range for urban travel.",
      pricePerDay: 3800,
      location: "Surat",
      fuelType: "Electric",
      images: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=80",
      ],
      specs: {
        seats: 5,
        transmission: "Automatic",
        mileage: "420 km range",
      },
      addons: [
        { name: "Home charger cable", price: 650 },
        { name: "Priority charging support", price: 500 },
      ],
    }),
    await createCarSeed(owner._id, {
      title: "Toyota Fortuner Legender",
      brand: "Toyota",
      category: "Luxury SUV",
      year: 2024,
      description:
        "A large-format premium SUV for executive trips, outstation travel, and high-comfort road presence.",
      pricePerDay: 6900,
      location: "Mumbai",
      fuelType: "Diesel",
      images: [
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=80",
      ],
      specs: {
        seats: 7,
        transmission: "Automatic",
        mileage: "14 km/l",
      },
      addons: [
        { name: "Professional chauffeur", price: 2200 },
        { name: "Corporate welcome kit", price: 650 },
      ],
    }),
    await createCarSeed(owner._id, {
      title: "MG ZS EV Exclusive",
      brand: "MG",
      category: "Electric SUV",
      year: 2024,
      description:
        "A modern electric SUV with a calm cabin, smart controls, and a clean presentation-friendly design.",
      pricePerDay: 4400,
      location: "Pune",
      fuelType: "Electric",
      images: [
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1400&q=80",
      ],
      specs: {
        seats: 5,
        transmission: "Automatic",
        mileage: "430 km range",
      },
    }),
  ]);

  customer.wishlist = [seededCars[0]._id, seededCars[4]._id];
  await customer.save();

  await Booking.create([
    {
      user: customer._id,
      car: seededCars[1]._id,
      startDate: createUtcDate(2),
      endDate: createUtcDate(5),
      totalPrice: seededCars[1].pricePerDay * 3 + 900,
      bookingCode: "DE-SEED-1001",
      addons: [{ name: "Airport pickup", price: 900 }],
      deliveryMethod: "homeDelivery",
      status: "Booked",
      payment: {
        provider: "dummy",
        sessionId: "seed-session-booked",
        orderId: "seed-order-booked",
        transactionId: "seed-transaction-booked",
        method: "upi",
        status: "paid",
        amount: seededCars[1].pricePerDay * 3 + 900,
        paidAt: createUtcDate(0),
      },
    },
    {
      user: secondCustomer._id,
      car: seededCars[2]._id,
      startDate: createUtcDate(-8),
      endDate: createUtcDate(-5),
      totalPrice: seededCars[2].pricePerDay * 3 + 650,
      bookingCode: "DE-SEED-1002",
      addons: [{ name: "Home charger cable", price: 650 }],
      deliveryMethod: "selfPickup",
      status: "Completed",
      conditionReport: {
        beforeImages: [],
        afterImages: [],
      },
      damageReport: {
        possibleDamage: false,
        notes: "No automatic mismatch detected.",
      },
      payment: {
        provider: "dummy",
        sessionId: "seed-session-completed",
        orderId: "seed-order-completed",
        transactionId: "seed-transaction-completed",
        method: "card",
        status: "paid",
        amount: seededCars[2].pricePerDay * 3 + 650,
        paidAt: createUtcDate(-9),
      },
    },
  ]);

  console.log("Seed complete for DriveEase.");
  console.log("Admin  : admin@driveease.demo / Admin@123");
  console.log("Owner  : owner@driveease.demo / Owner@123");
  console.log("User   : customer@driveease.demo / User@123");
  console.log("User 2 : riya@driveease.demo / User@123");
  console.log(
    `Cars seeded: ${seededCars.map((car) => `${car.title} (${car.location})`).join(", ")}`,
  );
}

run()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
