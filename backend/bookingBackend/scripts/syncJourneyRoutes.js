const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
const Route = require("../models/Route");

const normalizeRoute = (route) => ({
  busImageUrl: route.busImageUrl || "",
  busId: String(route.busId || "").trim().toUpperCase(),
  routeName: String(route.routeName || "").trim(),
  busType: String(route.busType || "AC").trim(),
  status: ["Certified", "Pending", "Cancelled"].includes(route.status)
    ? route.status
    : "Certified",
  departureTime: String(route.departureTime || "00:00").trim(),
  arrivalTime: String(route.arrivalTime || "00:00").trim(),
  departureLocation: String(route.departureLocation || "").trim(),
  arrivalLocation: String(route.arrivalLocation || "").trim(),
  departureDate: route.departureDate ? new Date(route.departureDate) : new Date(),
  price: Number(route.price || 0)
});

const loadJourneyRoutes = () => {
  const dataFile = path.resolve(
    __dirname,
    "../../../frontend/routeManagementFrontend/src/data/routes.json"
  );

  const fileContent = fs.readFileSync(dataFile, "utf8");
  const parsed = JSON.parse(fileContent);

  if (!parsed || !parsed.data || !Array.isArray(parsed.data.routes)) {
    throw new Error("Invalid routes.json format: expected data.routes[]");
  }

  return parsed.data.routes;
};

const syncRoutes = async () => {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });

  await connectDB();

  const sourceRoutes = loadJourneyRoutes();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const rawRoute of sourceRoutes) {
    const route = normalizeRoute(rawRoute);

    if (
      !route.busId ||
      !route.routeName ||
      !route.departureLocation ||
      !route.arrivalLocation ||
      !route.departureTime ||
      !route.arrivalTime
    ) {
      skipped += 1;
      continue;
    }

    const existing = await Route.findOne({ busId: route.busId }).select("_id");

    await Route.updateOne(
      { busId: route.busId },
      { $set: route },
      { upsert: true }
    );

    if (existing) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  const total = await Route.countDocuments({});
  console.log(`Journey route sync completed: inserted=${inserted}, updated=${updated}, skipped=${skipped}, totalRoutesInDb=${total}`);
};

syncRoutes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Journey route sync failed:", error.message);
    process.exit(1);
  });
