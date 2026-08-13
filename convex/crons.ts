import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "Send reminders for approaching tasks",
  { minutes: 5 },
  api.cronJobs.sendApproachingReminders
);

export default crons;
