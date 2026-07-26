#!/usr/bin/env node
/**
 * Sets up Windows Task Scheduler for the leadgen automation loop.
 * 
 * Creates two tasks:
 *   1. "Leadgen Daily Loop" — runs every day at 6:00 AM
 *   2. "Leadgen Weekly Report" — runs every Monday at 9:00 AM (placeholder)
 * 
 * Usage:
 *   node scripts/setup-scheduler.js          # Create tasks
 *   node scripts/setup-scheduler.js --remove # Remove tasks
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const SCRIPTS_DIR = path.join(__dirname);
const NODE = process.execPath;
const LOOP_SCRIPT = path.join(SCRIPTS_DIR, "automation-loop.js");
const BATCH_FILE = path.join(SCRIPTS_DIR, "run-loop.bat");

const REMOVE = process.argv.includes("--remove");

function createBatchFile() {
  const content = `@echo off
cd /d "${path.join(SCRIPTS_DIR, "..")}"
"${NODE}" "${LOOP_SCRIPT}" >> "${path.join(SCRIPTS_DIR, "..", "logs", "loop.log")}" 2>&1
`;
  fs.writeFileSync(BATCH_FILE, content);
  console.log(`Created: ${BATCH_FILE}`);
}

function runPowershell(cmd) {
  try {
    return execSync(`powershell -Command "${cmd}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return null;
  }
}

function removeTask(name) {
  const result = runPowershell(`Unregister-ScheduledTask -TaskName "${name}" -Confirm:$false -ErrorAction SilentlyContinue`);
  console.log(`Removed: ${name}`);
}

function createTask(name, description, triggerTime, action) {
  // Remove first if exists
  removeTask(name);

  // Create the task via PowerShell
  const cmd = `
    $action = New-ScheduledTaskAction -Execute "${BATCH_FILE}"
    $trigger = New-ScheduledTaskTrigger -${triggerTime}
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries
    Register-ScheduledTask -TaskName "${name}" -Description "${description}" -Action $action -Trigger $trigger -Settings $settings -Force
  `;

  const result = runPowershell(cmd.replace(/\n/g, " "));
  if (result && result.includes("OK")) {
    console.log(`Created: ${name}`);
  } else {
    console.log(`Task "${name}" registered (check Task Scheduler to verify)`);
  }
}

// Main
console.log("=== Leadgen Task Scheduler Setup ===\n");

if (REMOVE) {
  removeTask("Leadgen Daily Loop");
  removeTask("Leadgen Weekly Report");
  console.log("\nDone. Tasks removed.");
} else {
  createBatchFile();

  // Ensure logs dir exists
  const logsDir = path.join(SCRIPTS_DIR, "..", "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  // Daily loop at 6:00 AM
  createTask(
    "Leadgen Daily Loop",
    "Runs the leadgen automation loop: scrape, enrich, outreach for all active clients",
    "Daily -At 6:00AM"
  );

  // Weekly on Monday at 9:00 AM
  createTask(
    "Leadgen Weekly Report",
    "Weekly leadgen report and quota check",
    "Weekly -DaysOfWeek Monday -At 9:00AM"
  );

  console.log("\nDone. Tasks created. Verify in Task Scheduler (taskschd.msc).");
}
