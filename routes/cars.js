const express = require("express");

const Car = require("../models/Car");
const auth = require("../middleware/auth");
const ownerOnly = require("../middleware/ownerOnly");
const { setUploadType, upload } = require("../middleware/upload");
const {
  decorateCarWithAvailability,
  decorateCarsWithAvailability,
} = require("../utils/carAvailability");
const { resolveLocationCoords } = require("../utils/geocode");

const router = express.Router();

const parseBoolean = (value) => value === true || value === "true";
const hasOwnProperty = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key);
const createRouteError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parseAddons = (value) => {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return [];
    }
  }

  return Array.isArray(value) ? value : [];
};

const parseDeliveryOptions = (body) => {
  if (body.deliveryOptions) {
    try {
      return JSON.parse(body.deliveryOptions);
    } catch (error) {
      return {
        homeDelivery: false,
        meetUpPoint: "",
        selfPickup: true,
      };
    }
  }

  return {
    homeDelivery: parseBoolean(body.homeDelivery),
    meetUpPoint: body.meetUpPoint || "",
    selfPickup:
      body.selfPickup === undefined ? true : parseBoolean(body.selfPickup),
  };
};

const canManageCar = (car, user) =>
  user.role === "admin" || car.owner?.toString() === user.userId;

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const hasDeliveryPayload = (body) =>
  hasOwnProperty(body, "deliveryOptions") ||
  ["homeDelivery", "meetUpPoint", "selfPickup"].some((key) =>
    hasOwnProperty(body, key),
  );

const resolveSubmittedCoords = async ({ location, lat, lng }) => {
  const parsedLat = parseOptionalNumber(lat);
  const parsedLng = parseOptionalNumber(lng);

  if (parsedLat !== undefined && parsedLng !== undefined) {
    return {
      lat: parsedLat,
      lng: parsedLng,
    };
  }

  const resolvedCoords = await resolveLocationCoords(location);

  if (!resolvedCoords) {
    throw createRouteError(
      400,
      "Unable to resolve map coordinates for that location. Please use a clear city name like Vadodara or Ahmedabad.",
    );
  }

  return {
    lat: resolvedCoords.lat,
    lng: resolvedCoords.lng,
  };
};

const buildCarPayload = async (req, { partial = false } = {}) => {
  const {
    title,
    brand,
    category,
    year,
    description,
    pricePerDay,
    location,
    fuelType,
    seats,
    transmission,
    mileage,
    lat,
    lng,
    isAvailable,
  } = req.body;

  const images = req.files?.map((file) => file.path) || [];
  const payload = {};

  if (!partial || hasOwnProperty(req.body, "title")) {
    payload.title = title;
  }

  if (!partial || hasOwnProperty(req.body, "brand")) {
    payload.brand = brand;
  }

  if (!partial || hasOwnProperty(req.body, "category")) {
    payload.category = category;
  }

  if (!partial || hasOwnProperty(req.body, "year")) {
    payload.year = parseOptionalNumber(year);
  }

  if (!partial || hasOwnProperty(req.body, "description")) {
    payload.description = description;
  }

  if (!partial || hasOwnProperty(req.body, "pricePerDay")) {
    payload.pricePerDay = parseOptionalNumber(pricePerDay);
  }

  if (!partial || hasOwnProperty(req.body, "location")) {
    payload.location = location;
  }

  if (!partial || hasOwnProperty(req.body, "fuelType")) {
    payload.fuelType = fuelType;
  }

  payload.images = images;

  const specs = {};

  if (!partial || hasOwnProperty(req.body, "seats")) {
    specs.seats = parseOptionalNumber(seats);
  }

  if (!partial || hasOwnProperty(req.body, "transmission")) {
    specs.transmission = transmission;
  }

  if (!partial || hasOwnProperty(req.body, "mileage")) {
    specs.mileage = mileage;
  }

  if (Object.keys(specs).length > 0) {
    payload.specs = specs;
  }

  if (!partial || hasOwnProperty(req.body, "addons")) {
    payload.addons = parseAddons(req.body.addons)
      .filter((addon) => addon && addon.name)
      .map((addon) => ({
        name: String(addon.name).trim(),
        price: Number(addon.price) || 0,
      }));
  }

  if (!partial || hasDeliveryPayload(req.body)) {
    payload.deliveryOptions = parseDeliveryOptions(req.body);
  }

  if (
    !partial ||
    hasOwnProperty(req.body, "location") ||
    hasOwnProperty(req.body, "lat") ||
    hasOwnProperty(req.body, "lng")
  ) {
    payload.locationCoords = await resolveSubmittedCoords({
      location,
      lat,
      lng,
    });
  }

  if (!partial || hasOwnProperty(req.body, "isAvailable")) {
    payload.isAvailable =
      isAvailable === undefined ? true : parseBoolean(isAvailable);
  }

  return payload;
};

const listCars = async (req, res) => {
  try {
    const { location, fuelType, maxPrice, search, limit, category } = req.query;
    const filter = {};

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (fuelType) {
      filter.fuelType = fuelType;
    }

    if (category) {
      filter.category = category;
    }

    if (maxPrice) {
      filter.pricePerDay = { $lte: Number(maxPrice) };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const query = Car.find(filter)
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    if (limit) {
      query.limit(Number(limit));
    }

    const cars = await query;
    const decoratedCars = await decorateCarsWithAvailability(cars);
    const filteredCars =
      req.query.available === "true"
        ? decoratedCars.filter((car) => car.canBook)
        : decoratedCars;

    res.json(filteredCars);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

router.get("/", listCars);
router.get("/search/filter", listCars);

router.get("/mine/listings", auth, ownerOnly, async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user.userId }).sort({
      createdAt: -1,
    });
    const decoratedCars = await decorateCarsWithAvailability(cars);
    res.json(decoratedCars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/",
  auth,
  ownerOnly,
  setUploadType("car"),
  upload.array("images", 6),
  async (req, res) => {
    try {
      const payload = await buildCarPayload(req);

      if (!payload.title || !payload.location || !payload.fuelType) {
        return res.status(400).json({
          error: "Title, location, and fuel type are required",
        });
      }

      const car = await Car.create({
        ...payload,
        owner: req.user.userId,
      });
      const decoratedCar = await decorateCarWithAvailability(car);

      res.status(201).json({
        message: "Car added successfully",
        car: decoratedCar,
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  },
);

router.put(
  "/:id",
  auth,
  ownerOnly,
  setUploadType("car"),
  upload.array("images", 6),
  async (req, res) => {
    try {
      const car = await Car.findById(req.params.id);

      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }

      if (!canManageCar(car, req.user)) {
        return res
          .status(403)
          .json({ error: "Not authorized to edit this car" });
      }

      const payload = await buildCarPayload(req, { partial: true });
      const incomingEntries = Object.entries(payload).filter(
        ([, value]) => value !== undefined,
      );

      incomingEntries.forEach(([key, value]) => {
        if (key === "images" && value.length === 0) {
          return;
        }

        car[key] = value;
      });

      if (req.body.replaceImages === "true") {
        car.images = payload.images;
      } else if (payload.images.length > 0) {
        car.images = [...car.images, ...payload.images];
      }

      await car.save();
      const decoratedCar = await decorateCarWithAvailability(car);

      res.json({
        message: "Car updated successfully",
        car: decoratedCar,
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  },
);

router.post("/:id/addons", auth, ownerOnly, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    if (!canManageCar(car, req.user)) {
      return res.status(403).json({ error: "Not authorized to edit this car" });
    }

    car.addons = parseAddons(req.body.addons || req.body)
      .filter((addon) => addon && addon.name)
      .map((addon) => ({
        name: String(addon.name).trim(),
        price: Number(addon.price) || 0,
      }));

    await car.save();

    res.json({
      message: "Add-ons updated successfully",
      addons: car.addons,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/delivery", auth, ownerOnly, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    if (!canManageCar(car, req.user)) {
      return res.status(403).json({ error: "Not authorized to edit this car" });
    }

    car.deliveryOptions = parseDeliveryOptions(req.body);

    await car.save();

    res.json({
      message: "Delivery options updated",
      deliveryOptions: car.deliveryOptions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate(
      "owner",
      "name email",
    );

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    const decoratedCar = await decorateCarWithAvailability(car);

    res.json(decoratedCar);
  } catch (error) {
    res.status(400).json({ error: "Invalid car ID" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    if (req.user.role !== "admin" && !canManageCar(car, req.user)) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this car" });
    }

    await car.deleteOne();

    res.json({ message: "Car deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
