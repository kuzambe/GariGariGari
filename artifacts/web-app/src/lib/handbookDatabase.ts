/**
 * Returns the most direct URL possible for a vehicle owner's manual.
 * Falls back to a Google search pre-filled with year + make + model + "owner manual PDF".
 */

function slug(s: string) {
  return encodeURIComponent(s.toLowerCase().trim().replace(/\s+/g, "-"));
}

function q(s: string) {
  return encodeURIComponent(s.trim());
}

function googleFallback(year: number | string, make: string, model: string) {
  return `https://www.google.com/search?q=${q(`${year} ${make} ${model} owner manual PDF free`)}`;
}

type ManualUrlFn = (year: number | string, make: string, model: string) => string;

const MAKE_URL_BUILDERS: Record<string, ManualUrlFn> = {
  honda: (year, _make, model) =>
    `https://owners.honda.com/vehicles/information/${year}/${slug(model)}/guides`,

  acura: (year, _make, model) =>
    `https://www.acura.com/en/owner/manuals?year=${year}&model=${q(model)}`,

  toyota: (year, _make, model) =>
    `https://www.toyota.com/configurator/pub/flow/welcome?modelCode=${q(model)}&modelYear=${year}`,

  lexus: (year, _make, model) =>
    `https://www.lexus.com/en/owners/resources?year=${year}&model=${q(model)}`,

  ford: (year, _make, model) =>
    `https://www.fordservicecontent.com/Ford_Content/vdirsnet/OwnerManual/Home/Content?languageCode=en&countryCode=USA&bookCode=OM&model=${q(model)}&modelYear=${year}`,

  lincoln: (year, _make, model) =>
    `https://www.lincolnvehicles.com/owner-manuals/find-your-manual?year=${year}&model=${q(model)}`,

  chevrolet: (_year, _make, _model) =>
    `https://my.chevrolet.com/vehicleResources`,

  gmc: (_year, _make, _model) =>
    `https://www.gmc.com/owner-center/resources`,

  buick: (_year, _make, _model) =>
    `https://www.buick.com/support`,

  cadillac: (_year, _make, _model) =>
    `https://www.cadillac.com/support`,

  dodge: (year, _make, model) =>
    `https://www.mopar.com/en-us/care/owners-manual.html?year=${year}&make=dodge&model=${q(model)}`,

  ram: (year, _make, model) =>
    `https://www.mopar.com/en-us/care/owners-manual.html?year=${year}&make=ram&model=${q(model)}`,

  jeep: (year, _make, model) =>
    `https://www.mopar.com/en-us/care/owners-manual.html?year=${year}&make=jeep&model=${q(model)}`,

  chrysler: (year, _make, model) =>
    `https://www.mopar.com/en-us/care/owners-manual.html?year=${year}&make=chrysler&model=${q(model)}`,

  nissan: (year, _make, model) =>
    `https://www.nissan-global.com/EN/SERVICE/OWNER_MANUAL/?year=${year}&model=${q(model)}`,

  infiniti: (year, _make, model) =>
    `https://www.infinitiusa.com/owners-resources?year=${year}&model=${q(model)}`,

  hyundai: (year, _make, model) =>
    `https://www.hyundaiusa.com/us/en/vehicle-manual-viewer#year=${year}&model=${q(model)}`,

  genesis: (year, _make, model) =>
    `https://www.genesis.com/us/en/owner/resources.html?year=${year}&model=${q(model)}`,

  kia: (year, _make, model) =>
    `https://www.kia.com/us/en/owner/resources/owners-manual.html?year=${year}&model=${q(model)}`,

  subaru: (year, _make, model) =>
    `https://www.subaru.com/owners/resources/owner-manual.html?year=${year}&model=${q(model)}`,

  mazda: (year, _make, model) =>
    `https://www.mazdausa.com/current-offers/owners?year=${year}&model=${q(model)}`,

  mitsubishi: (year, _make, model) =>
    `https://www.mitsubishicars.com/owners?year=${year}&model=${q(model)}`,

  volkswagen: (year, _make, model) =>
    `https://www.vw.com/en/models.html#year=${year}&model=${q(model)}`,

  vw: (year, make, model) => MAKE_URL_BUILDERS["volkswagen"](year, make, model),

  audi: (year, _make, model) =>
    `https://www.audiusa.com/us/web/en/owner.html?year=${year}&model=${q(model)}`,

  bmw: (year, _make, model) =>
    `https://www.bmwusa.com/explore/bmwgenius/owners-manual-library.html?year=${year}&model=${q(model)}`,

  mini: (year, _make, model) =>
    `https://www.miniusa.com/owners-manual.html?year=${year}&model=${q(model)}`,

  mercedesbenz: (year, _make, model) =>
    `https://www.mbusa.com/en/owner-resources/mercedes-manuals?year=${year}&model=${q(model)}`,

  mercedes: (year, make, model) => MAKE_URL_BUILDERS["mercedesbenz"](year, make, model),

  porsche: (year, _make, model) =>
    `https://finder.porsche.com/us/en-US/models?year=${year}&model=${q(model)}`,

  volvo: (year, _make, model) =>
    `https://www.volvocars.com/us/support/manuals-software?year=${year}&model=${q(model)}`,

  jaguar: (year, _make, model) =>
    `https://www.jaguarusa.com/owners/manuals-and-guides.html?year=${year}&model=${q(model)}`,

  "land rover": (year, _make, model) =>
    `https://www.landroverusa.com/ownership/manuals.html?year=${year}&model=${q(model)}`,

  landrover: (year, make, model) => MAKE_URL_BUILDERS["land rover"](year, make, model),

  tesla: (year, _make, model) =>
    `https://www.tesla.com/ownersmanual/${q(model.toLowerCase().replace(/\s+/g, ""))}/${year}_${q(model.toLowerCase().replace(/\s+/g, ""))}_ownersmanual/en_us/`,
};

/**
 * Returns the most specific manual URL for a vehicle.
 * Falls back to Google search if no builder is found.
 */
export function getManualUrl(
  year: number | string | null | undefined,
  make: string | null | undefined,
  model: string | null | undefined,
): string {
  const y = year ?? "";
  const mk = (make ?? "").trim();
  const md = (model ?? "").trim();

  const key = mk.toLowerCase().replace(/[-\s]+/g, "");
  const builder = MAKE_URL_BUILDERS[key] ?? MAKE_URL_BUILDERS[mk.toLowerCase()];

  if (builder) {
    return builder(y, mk, md);
  }

  return googleFallback(y, mk, md);
}
