export interface VehicleDetails {
  vin: string;
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  fuelType: string;
  bodyStyle: string;
}

function pick(results: { Variable: string; Value: string | null }[], variable: string): string {
  const entry = results.find((r) => r.Variable === variable);
  return entry?.Value && entry.Value !== "Not Applicable" ? entry.Value : "";
}

export async function decodeVin(vin: string): Promise<VehicleDetails> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin.trim()}?format=json`
  );
  if (!res.ok) throw new Error("NHTSA lookup failed");

  const data = await res.json();
  const results: { Variable: string; Value: string | null }[] = data.Results ?? [];

  const make = pick(results, "Make");
  const model = pick(results, "Model");
  const year = pick(results, "Model Year");
  const trim = pick(results, "Trim");
  const displacement = pick(results, "Displacement (L)");
  const cylinders = pick(results, "Engine Number of Cylinders");
  const fuelType = pick(results, "Fuel Type - Primary");
  const bodyStyle = pick(results, "Body Class");

  if (!make || !model || !year) {
    throw new Error("VIN not recognised — please check the number and try again.");
  }

  const engineParts = [
    displacement ? `${parseFloat(displacement).toFixed(1)}L` : "",
    cylinders ? `${cylinders}-cyl` : "",
  ].filter(Boolean);

  return {
    vin: vin.trim().toUpperCase(),
    make,
    model,
    year,
    trim,
    engine: engineParts.join(" "),
    fuelType,
    bodyStyle,
  };
}
