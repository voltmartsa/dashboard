import "server-only";
import { lookup } from "dns/promises";
import { isIP } from "net";

// Reads the current price of a product page on any shop. Tries the shop's own
// product API first (WooCommerce Store API, Shopify .js), then falls back to
// price data embedded in the page (JSON-LD, meta tags).

export type PriceResult = {
  price: number;
  regularPrice: number | null;
  title: string;
  inStock: boolean | null;
};

const UA = "Mozilla/5.0 (compatible; SquashPriceCompare/1.0)";
const TIMEOUT_MS = 20_000;

function isPrivateAddress(ip: string) {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    return v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("::ffff:127.") || v6 === "::";
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

// Links are user-supplied and fetched from our server, so refuse anything that
// isn't a public http(s) website (localhost, internal IPs, cloud metadata, etc).
export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("That isn't a valid link.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Link must start with http:// or https://");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (addresses.length === 0) throw new Error(`Couldn't find the website ${u.hostname}.`);
  if (addresses.some(isPrivateAddress)) throw new Error("Only public shop websites can be tracked.");
  u.hash = "";
  return u;
}

// Follows redirects by hand so every hop gets the same public-address check.
async function getText(url: string) {
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(current, {
      headers: { "User-Agent": UA, Accept: "*/*" },
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = (await assertPublicUrl(new URL(location, current).toString())).toString();
      continue;
    }
    if (!res.ok) throw new Error(`The shop returned HTTP ${res.status}`);
    return res.text();
  }
  throw new Error("Too many redirects");
}

function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

type ShopifyVariant = { id: number; price: number; compare_at_price: number | null; available?: boolean };

async function fromShopify(u: URL): Promise<PriceResult | null> {
  if (!/\/products\//.test(u.pathname)) return null;
  // The .js endpoint includes stock availability; prices there are in cents.
  let p: { title: string; variants?: ShopifyVariant[] };
  try {
    p = JSON.parse(await getText(`${u.origin}${u.pathname.replace(/\/$/, "")}.js`));
  } catch {
    return null;
  }
  if (!p?.variants?.length) return null;
  const variantId = u.searchParams.get("variant");
  const v = p.variants.find((x) => String(x.id) === variantId) ?? p.variants[0];
  return {
    price: v.price / 100,
    regularPrice: v.compare_at_price && v.compare_at_price > v.price ? v.compare_at_price / 100 : null,
    title: p.title,
    inStock: v.available ?? null,
  };
}

type WooProduct = {
  name: string;
  is_in_stock?: boolean;
  prices?: { price: string; regular_price: string; currency_minor_unit?: number };
};

async function fromWooStoreApi(u: URL): Promise<PriceResult | null> {
  const slug = u.pathname.split("/").filter(Boolean).pop();
  if (!slug) return null;
  let list: WooProduct[];
  try {
    list = JSON.parse(await getText(`${u.origin}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`));
  } catch {
    return null;
  }
  const p = Array.isArray(list) ? list[0] : null;
  if (!p?.prices) return null;
  const d = 10 ** (p.prices.currency_minor_unit ?? 2);
  const price = Number(p.prices.price) / d;
  if (!price) return null;
  const regular = Number(p.prices.regular_price) / d;
  return {
    price,
    regularPrice: regular > price ? regular : null,
    title: decodeEntities(p.name),
    inStock: p.is_in_stock ?? null,
  };
}

type JsonLdOffer = { price?: unknown; lowPrice?: unknown; availability?: string; priceSpecification?: { price?: unknown } | { price?: unknown }[] };

function fromHtml(html: string): PriceResult | null {
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  for (const raw of blocks) {
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const nodes = ([] as Record<string, unknown>[]).concat((json["@graph"] as Record<string, unknown>[]) ?? json);
    for (const n of nodes) {
      const types = ([] as unknown[]).concat(n["@type"] ?? []);
      if (!types.includes("Product")) continue;
      const offers = ([] as JsonLdOffer[]).concat((n.offers as JsonLdOffer) ?? []);
      for (const o of offers) {
        const spec = ([] as { price?: unknown }[]).concat(o.priceSpecification ?? [])[0];
        const price = Number(o.price ?? o.lowPrice ?? spec?.price);
        if (price) {
          return {
            price,
            regularPrice: null,
            title: decodeEntities(String(n.name ?? "")),
            inStock: o.availability ? /InStock/i.test(o.availability) : null,
          };
        }
      }
    }
  }
  const meta = html.match(/<meta[^>]+(?:property|itemprop)=["'](?:product:price:amount|og:price:amount|price)["'][^>]+content=["']([\d.,]+)["']/i);
  if (meta) {
    const title = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "";
    return { price: Number(meta[1].replace(/,/g, "")), regularPrice: null, title: decodeEntities(title), inStock: null };
  }
  return null;
}

export async function fetchPrice(url: string): Promise<PriceResult> {
  const u = await assertPublicUrl(url);
  const result = (await fromShopify(u)) ?? (await fromWooStoreApi(u)) ?? fromHtml(await getText(u.toString()));
  if (!result?.price) throw new Error("No price found on this page");
  return result;
}
