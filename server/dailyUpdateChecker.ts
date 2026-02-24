import { storage } from "./storage";
import { recalcGrinderStats } from "./recalcStats";

const CHECK_INTERVAL_MS = 60 * 1000;
let checkerInterval: ReturnType<typeof setInterval> | null = null;

function getETComponents(): { hours: number; minutes: number; year: number; month: number; day: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric", minute: "numeric", year: "numeric", month: "numeric", day: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || "0", 10);
  return { hours: get("hour") === 24 ? 0 : get("hour"), minutes: get("minute"), year: get("year"), month: get("month"), day: get("day") };
}

function getETMidnightUTC(): Date {
  const { year, month, day } = getETComponents();
  const etMidnightStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`;
  const tempDate = new Date(etMidnightStr + "Z");
  const now = new Date();
  const etOffsetStr = now.toLocaleString("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" });
  const offsetMatch = etOffsetStr.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1], 10) : -5;
  return new Date(tempDate.getTime() - offsetHours * 60 * 60 * 1000);
}

export function getDailyUpdateDeadlineInfo() {
  const { hours, minutes } = getETComponents();
  const midnightUTC = getETMidnightUTC();
  const deadlineUTC = new Date(midnightUTC.getTime() + 30 * 60 * 1000);

  const isInCountdown = hours === 0 && minutes < 30;
  const isPastDeadline = hours === 0 && minutes >= 30;
  const msUntilDeadline = isInCountdown ? deadlineUTC.getTime() - Date.now() : 0;

  return { isInCountdown, isPastDeadline, msUntilDeadline, deadlineET: deadlineUTC };
}

async function checkDailyUpdates() {
  try {
    const { hours, minutes } = getETComponents();

    if (hours !== 0 || minutes < 30 || minutes > 35) return;

    const allAssignments = await storage.getAssignments();
    const activeAssignments = allAssignments.filter((a: any) => a.status === "Active");

    if (activeAssignments.length === 0) return;

    const allUpdates = await storage.getOrderUpdates();

    const todayMidnight = getETMidnightUTC();
    const yesterdayMidnight = new Date(todayMidnight.getTime() - 24 * 60 * 60 * 1000);

    const grindersToRecalc = new Set<string>();

    for (const assignment of activeAssignments) {
      const assignmentUpdates = allUpdates.filter(
        (u: any) => u.assignmentId === assignment.id && u.updateType === "progress"
      );

      const todayUpdates = assignmentUpdates.filter((u: any) => {
        const updateDate = new Date(u.createdAt);
        return updateDate >= yesterdayMidnight && updateDate < todayMidnight;
      });

      if (todayUpdates.length === 0) {
        await storage.createActivityCheckpoint({
          id: `CP-${Date.now().toString(36)}-miss-${assignment.id.slice(-4)}`,
          assignmentId: assignment.id,
          orderId: assignment.orderId,
          grinderId: assignment.grinderId,
          type: "missed_update",
          response: "auto",
          note: `Missed daily update deadline (12:30 AM ET) for ${todayMidnight.toLocaleDateString("en-US")}`,
        });

        await storage.createStaffAlert({
          id: `SA-${Date.now().toString(36)}-mu`,
          targetType: "grinder",
          grinderId: assignment.grinderId,
          title: "Missed Daily Update",
          message: `You missed the daily order update deadline (12:30 AM ET) for assignment ${assignment.id}. This affects your performance scorecard.`,
          severity: "warning",
          createdBy: "system",
        });

        grindersToRecalc.add(assignment.grinderId);
        console.log(`[daily-update] Grinder ${assignment.grinderId} missed update for assignment ${assignment.id}`);
      }
    }

    for (const grinderId of grindersToRecalc) {
      await recalcGrinderStats(grinderId);
    }

    if (grindersToRecalc.size > 0) {
      console.log(`[daily-update] Flagged ${grindersToRecalc.size} grinder(s) for missed daily updates`);
    }
  } catch (error) {
    console.error("[daily-update] Error checking daily updates:", error);
  }
}

export function startDailyUpdateChecker() {
  checkerInterval = setInterval(checkDailyUpdates, CHECK_INTERVAL_MS);
  console.log(`[daily-update] Deadline checker started (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
}

export function stopDailyUpdateChecker() {
  if (checkerInterval) {
    clearInterval(checkerInterval);
    checkerInterval = null;
  }
}
