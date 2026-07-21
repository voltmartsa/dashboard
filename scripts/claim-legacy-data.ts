// One-off script: assigns every row with ownerId: null (created before user
// accounts existed) to a chosen user. Run once, right after creating your
// account: npm run claim-legacy-data -- <your-user-id>
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: npm run claim-legacy-data -- <your-user-id>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`No user found with id "${userId}".`);
    process.exit(1);
  }

  const where = { ownerId: null };
  const data = { ownerId: userId };

  const results = [
    ["Task", await prisma.task.updateMany({ where, data })],
    ["Project", await prisma.project.updateMany({ where, data })],
    ["Note", await prisma.note.updateMany({ where, data })],
    ["Habit", await prisma.habit.updateMany({ where, data })],
    ["Document", await prisma.document.updateMany({ where, data })],
    ["TimezoneEntry", await prisma.timezoneEntry.updateMany({ where, data })],
    ["WeatherLocation", await prisma.weatherLocation.updateMany({ where, data })],
    ["NotificationRecipient", await prisma.notificationRecipient.updateMany({ where, data })],
  ] as const;

  for (const [label, result] of results) {
    console.log(`${label}: claimed ${result.count} row(s) for ${user.email}.`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
