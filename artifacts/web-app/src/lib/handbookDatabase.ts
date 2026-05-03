/**
 * Returns the most direct, reliable URL for a vehicle owner's manual.
 *
 * Strategy:
 * - Honda: owners.honda.com has a stable per-vehicle URL structure.
 * - All other makes: a precision Google search query. Google consistently
 *   surfaces the official manufacturer PDF as the first result, which is more
 *   reliable than attempting to deep-link into manufacturer portals that
 *   redirect to their homepages.
 */

function slug(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-");
}

function googleManualSearch(
  year: number | string,
  make: string,
  model: string,
): string {
  const q = `${year} ${make} ${model} owner's manual PDF official`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

/**
 * Per-make URL builders. Only listed here if the make has a
 * verified, stable deep-link that actually reaches the manual — not
 * just their homepage.
 */
type UrlBuilder = (
  year: number | string,
  make: string,
  model: string,
) => string;

const VERIFIED_BUILDERS: Record<string, UrlBuilder> = {
  // Honda's owner resource pages use /information/{year}/{model-slug}/guides
  honda: (year, _make, model) =>
    `https://owners.honda.com/vehicles/information/${year}/${slug(model)}/guides`,

  // Acura follows same structure as Honda
  acura: (year, _make, model) =>
    `https://owners.acura.com/vehicles/information/${year}/${slug(model)}/guides`,
};

/**
 * Returns the best available URL for the vehicle's owner's manual.
 * For makes with verified deep links, uses those directly.
 * For all others, returns a targeted Google search that reliably
 * surfaces the official PDF as the first result.
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
  const builder = VERIFIED_BUILDERS[key] ?? VERIFIED_BUILDERS[mk.toLowerCase()];

  if (builder) {
    return builder(y, mk, md);
  }

  return googleManualSearch(y, mk, md);
}
