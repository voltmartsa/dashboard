import { prisma } from "../src/lib/prisma";
import { toUtcMidnight } from "../src/lib/dates";

async function main() {
  console.log("Seeding...");

  await prisma.habitLog.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  // --- Business ---
  const websiteRelaunch = await prisma.project.create({
    data: {
      name: "Website relaunch",
      description: "New marketing site with updated pricing and case studies.",
      area: "BUSINESS",
      status: "ACTIVE",
      color: "#0d6b4c",
      dueDate: daysFromNow(21),
    },
  });

  const q3Campaign = await prisma.project.create({
    data: {
      name: "Q3 marketing campaign",
      description: "Paid + organic push for the autumn product launch.",
      area: "BUSINESS",
      status: "PLANNED",
      color: "#0d6b4c",
      dueDate: daysFromNow(45),
    },
  });

  const proposalTask = await prisma.task.create({
    data: {
      title: "Send client proposal to Meridian Co.",
      description:
        "Finalize scope, pricing tiers, and timeline; send as PDF plus a short cover email.",
      area: "BUSINESS",
      status: "IN_PROGRESS",
      priority: "URGENT",
      dueDate: daysFromNow(2),
      order: 0,
    },
  });

  await prisma.task.create({
    data: {
      title: "Review Q2 invoices for outstanding payments",
      area: "BUSINESS",
      status: "TODO",
      priority: "HIGH",
      dueDate: daysFromNow(5),
      order: 1,
    },
  });

  const homepageTask = await prisma.task.create({
    data: {
      title: "Rebuild homepage hero section",
      description: "New headline, product screenshot, and CTA per the brand refresh.",
      area: "BUSINESS",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: daysFromNow(10),
      projectId: websiteRelaunch.id,
      order: 0,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Write hero headline copy",
        area: "BUSINESS",
        priority: "MEDIUM",
        projectId: websiteRelaunch.id,
        parentTaskId: homepageTask.id,
        aiGenerated: true,
        order: 0,
      },
      {
        title: "Source updated product screenshot",
        area: "BUSINESS",
        priority: "MEDIUM",
        projectId: websiteRelaunch.id,
        parentTaskId: homepageTask.id,
        aiGenerated: true,
        order: 1,
        status: "DONE",
        completedAt: daysFromNow(-1),
      },
      {
        title: "A/B test two CTA button variants",
        area: "BUSINESS",
        priority: "LOW",
        projectId: websiteRelaunch.id,
        parentTaskId: homepageTask.id,
        aiGenerated: true,
        order: 2,
      },
    ],
  });

  await prisma.task.create({
    data: {
      title: "Draft campaign budget",
      area: "BUSINESS",
      status: "TODO",
      priority: "MEDIUM",
      projectId: q3Campaign.id,
      dueDate: daysFromNow(14),
    },
  });

  await prisma.note.create({
    data: {
      title: "Meridian Co. call notes",
      content:
        "- Wants a 3-tier pricing structure\n- Needs case study from a similar-sized client\n- Decision by end of month\n- Key contact: ops director, cc's finance on everything",
      area: "BUSINESS",
      tags: "clients,sales",
      taskId: proposalTask.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "Competitor pricing research",
      content:
        "Surveyed 5 direct competitors. Most land between $49-$99/mo for the mid tier. We're currently underpriced relative to feature set — worth revisiting before the relaunch ships.",
      area: "BUSINESS",
      tags: "research,pricing",
      pinned: true,
      projectId: websiteRelaunch.id,
    },
  });

  // --- Personal ---
  const homeMoveProject = await prisma.project.create({
    data: {
      name: "Apartment move",
      description: "Move from the current flat to the new place across town.",
      area: "PERSONAL",
      status: "ACTIVE",
      color: "#0d6b4c",
      dueDate: daysFromNow(30),
    },
  });

  await prisma.task.create({
    data: {
      title: "Book movers for the 15th",
      area: "PERSONAL",
      status: "TODO",
      priority: "HIGH",
      dueDate: daysFromNow(6),
      projectId: homeMoveProject.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Cancel and transfer utilities",
      area: "PERSONAL",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: daysFromNow(12),
      projectId: homeMoveProject.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Renew passport before the trip",
      area: "PERSONAL",
      status: "TODO",
      priority: "HIGH",
      dueDate: daysFromNow(3),
    },
  });

  await prisma.task.create({
    data: {
      title: "Schedule dentist checkup",
      area: "PERSONAL",
      status: "DONE",
      priority: "LOW",
      completedAt: daysFromNow(-2),
    },
  });

  await prisma.note.create({
    data: {
      title: "Gift ideas for Mom's birthday",
      content: "- Pottery class voucher\n- The cookbook she mentioned twice\n- Photo book from the trip",
      area: "PERSONAL",
      tags: "gifts",
    },
  });

  // --- Habits (both areas), with the last 7 days logged ---
  const gymHabit = await prisma.habit.create({
    data: { name: "Gym session", area: "PERSONAL", frequency: "DAILY", color: "#0d6b4c" },
  });
  const readingHabit = await prisma.habit.create({
    data: { name: "Read 20 minutes", area: "PERSONAL", frequency: "DAILY", color: "#0d6b4c" },
  });
  const inboxZeroHabit = await prisma.habit.create({
    data: { name: "Inbox zero", area: "BUSINESS", frequency: "DAILY", color: "#0d6b4c" },
  });

  const completionPattern: Record<string, boolean[]> = {
    [gymHabit.id]: [true, true, false, true, true, false, false],
    [readingHabit.id]: [true, false, true, true, true, true, false],
    [inboxZeroHabit.id]: [false, true, true, false, true, true, false],
  };

  for (const [habitId, pattern] of Object.entries(completionPattern)) {
    for (let i = 0; i < pattern.length; i++) {
      const date = toUtcMidnight(daysFromNow(-(pattern.length - 1 - i)));
      if (pattern[i]) {
        await prisma.habitLog.create({ data: { habitId, date, completed: true } });
      }
    }
  }

  console.log("Seed complete.");
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
