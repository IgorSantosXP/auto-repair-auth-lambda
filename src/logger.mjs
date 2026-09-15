export function log(level, message, fields = {}) {
  process.stdout.write(
    JSON.stringify({
      level,
      message,
      service: "auto-repair-auth",
      timestamp: new Date().toISOString(),
      ...fields
    }) + "\n"
  );
}
