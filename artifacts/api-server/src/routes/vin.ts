import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/vin/:vin", async (req, res) => {
  const vin = (req.params.vin ?? "").trim().toUpperCase();

  if (!vin || vin.length !== 17) {
    res.status(400).json({ error: "VIN must be exactly 17 characters." });
    return;
  }
  if (/[IOQ]/.test(vin)) {
    res.status(400).json({ error: "VIN cannot contain the letters I, O, or Q." });
    return;
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    res.status(400).json({ error: "Invalid VIN format." });
    return;
  }

  try {
    const nhtsaRes = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`,
      { headers: { "Accept": "application/json" } }
    );

    if (!nhtsaRes.ok) {
      req.log.error({ status: nhtsaRes.status }, "NHTSA API error");
      res.status(502).json({ error: "VIN lookup service unavailable. Enter details manually." });
      return;
    }

    const json = (await nhtsaRes.json()) as {
      Results?: Array<{ Variable: string; Value: string | null }>;
    };

    const results = json.Results ?? [];
    const get = (name: string) => results.find((r) => r.Variable === name)?.Value ?? "";

    const data = {
      make: get("Make"),
      model: get("Model"),
      year: get("Model Year"),
      trim: get("Trim"),
      engine: get("Displacement (L)") ? `${get("Displacement (L)")}L` : "",
      fuel_type: get("Fuel Type - Primary"),
      body_style: get("Body Class"),
    };

    const hasData = data.make || data.model || data.year;
    if (!hasData) {
      res.status(404).json({ error: "No data found for this VIN. Enter details manually." });
      return;
    }

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to reach NHTSA VIN API");
    res.status(502).json({ error: "VIN lookup service unavailable. Enter details manually." });
  }
});

export default router;
