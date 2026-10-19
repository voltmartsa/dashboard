import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/email";
import { sendPushToUser } from "@/lib/notifications/push";
import { analyseItem, formatRand, type ItemData } from "@/lib/prices/analyse";
import { storeName } from "@/lib/prices/stores";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function loadPriceItems(ownerId: string): Promise<ItemData[]> {
  const items = await prisma.priceItem.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
    include: {
      links: {
        orderBy: { createdAt: "asc" },
        include: { points: { orderBy: { day: "desc" }, take: 30 } },
      },
    },
  });
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    costPrice: i.costPrice,
    links: i.links.map(({ points, ...l }) => ({
      ...l,
      history: points.reverse().map((p) => ({ day: p.day, price: p.price })),
    })),
  }));
}

export async function buildPriceReport(ownerId: string) {
  const items = await loadPriceItems(ownerId);
  const rows = items.map((item) => ({ item, a: analyseItem(item) }));
  const beaten = rows.filter((r) => r.a.state === "dearer").sort((x, y) => (y.a.gap ?? 0) - (x.a.gap ?? 0));
  const cheapestCount = rows.filter((r) => r.a.state === "cheapest").length;

  const changes = rows.flatMap(({ item, a }) =>
    item.links
      .filter((l) => l.history.length >= 2)
      .map((l) => ({ l, from: l.history[l.history.length - 2].price, to: l.history[l.history.length - 1].price }))
      .filter((c) => Math.abs(c.to - c.from) > 0.005)
      .map((c) => ({ ...c, name: a.name, shop: c.l.isMine ? "You" : storeName(c.l.url) })),
  );
  const errors = rows.flatMap(({ item, a }) =>
    item.links.filter((l) => l.error).map((l) => ({ name: a.name, shop: l.isMine ? "Your site" : storeName(l.url), url: l.url })),
  );

  const date = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Johannesburg" });
  const subject = beaten.length
    ? `Squash — competitors cheaper on ${beaten.length} product${beaten.length === 1 ? "" : "s"}`
    : "Squash — you're cheapest on everything tracked";

  const th = 'style="text-align:left;padding:8px 10px;font-size:12px;color:#8a8578;border-bottom:1px solid #e2dccb"';
  const td = 'style="padding:8px 10px;border-bottom:1px solid #f0ebe0;font-size:14px;vertical-align:top"';
  const tdr = 'style="padding:8px 10px;border-bottom:1px solid #f0ebe0;font-size:14px;text-align:right;white-space:nowrap;vertical-align:top"';
  const link = (url: string, text: string) => `<a href="${escapeHtml(url)}" style="color:#1c1a16">${escapeHtml(text)}</a>`;

  let html = `<div style="font-family:Arial,sans-serif;color:#1c1a16;max-width:680px">
    <h2 style="margin:0 0 4px">Competitor prices</h2>
    <p style="color:#8a8578;margin:0 0 16px">${escapeHtml(date)} · ${rows.length} products tracked · you're cheapest on ${cheapestCount} · competitors cheaper on ${beaten.length}</p>
    <h3 style="margin:16px 0 8px">Where a competitor is cheaper</h3>`;
  html += beaten.length
    ? `<table cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th ${th}>Product</th><th ${th} style="text-align:right">You</th><th ${th}>Cheapest</th><th ${th} style="text-align:right">Difference</th></tr>${beaten
        .map(({ a }) => {
          const diff = a.myPrice! - a.cheapest!.price!;
          return `<tr><td ${td}>${link(a.mine!.url, a.name)}</td><td ${tdr}>${formatRand(a.myPrice)}</td><td ${td}>${link(a.cheapest!.url, a.cheapest!.store)} ${formatRand(a.cheapest!.price)}</td><td ${tdr}><b style="color:#dc2626">${formatRand(diff)} (${Math.round(a.gap! * 100)}%)</b></td></tr>`;
        })
        .join("")}</table>`
    : `<p style="color:#047857;margin:0">None — you're the cheapest on every product with competitor prices.</p>`;

  html += `<h3 style="margin:24px 0 8px">Price changes since the previous check</h3>`;
  html += changes.length
    ? `<table cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th ${th}>Product</th><th ${th}>Shop</th><th ${th} style="text-align:right">Was</th><th ${th} style="text-align:right">Now</th></tr>${changes
        .map((c) => `<tr><td ${td}>${escapeHtml(c.name)}</td><td ${td}>${link(c.l.url, c.shop)}</td><td ${tdr}>${formatRand(c.from)}</td><td ${tdr}><b style="color:${c.to < c.from ? "#dc2626" : "#047857"}">${formatRand(c.to)} ${c.to < c.from ? "↓" : "↑"}</b></td></tr>`)
        .join("")}</table>`
    : `<p style="color:#8a8578;margin:0">No price changes.</p>`;

  if (errors.length) {
    html += `<h3 style="margin:24px 0 8px">Couldn't read these prices</h3><ul style="margin:0;padding-left:18px;color:#b45309">${errors
      .map((e) => `<li>${escapeHtml(e.shop)} — ${link(e.url, e.name)}</li>`)
      .join("")}</ul>`;
  }
  html += `</div>`;

  return { subject, html, itemCount: rows.length, beatenCount: beaten.length };
}

// Morning email to every recipient who opted into the price report, plus a
// push to their phone when a competitor is cheaper on anything.
export async function sendPriceReports() {
  const recipients = await prisma.notificationRecipient.findMany({
    where: { active: true, priceReport: true, ownerId: { not: null }, email: { not: null } },
  });
  const owners = [...new Set(recipients.map((r) => r.ownerId!))];
  const results: { recipientId: string; channel: string; ok: boolean; error?: string }[] = [];

  for (const ownerId of owners) {
    const report = await buildPriceReport(ownerId);
    if (report.itemCount === 0) continue;

    for (const r of recipients.filter((x) => x.ownerId === ownerId)) {
      try {
        await sendEmail(r.email!, report.subject, report.html);
        results.push({ recipientId: r.id, channel: "email", ok: true });
      } catch (err) {
        results.push({ recipientId: r.id, channel: "email", ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (report.beatenCount > 0) {
      try {
        await sendPushToUser(ownerId, { title: "Competitor prices", body: report.subject.replace(/^Squash — /, "") });
      } catch {
        // Push is best-effort — the email and the Prices page still have everything.
      }
    }
  }
  return results;
}
