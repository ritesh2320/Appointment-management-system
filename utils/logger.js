const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Colors for console output
const colors = {
  error: "\x1b[31m", // Red
  warn: "\x1b[33m", // Yellow
  info: "\x1b[36m", // Cyan
  debug: "\x1b[35m", // Magenta
  reset: "\x1b[0m",
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.errorLogPath = path.join(logsDir, "error.log");
    this.combinedLogPath = path.join(logsDir, "combined.log");
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
    return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${metaString}\n`;
  }

  writeToFile(filePath, message) {
    fs.appendFileSync(filePath, message);
  }

  shouldLog(level) {
    return levels[level] <= levels[this.logLevel];
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);

    // Write to combined log
    this.writeToFile(this.combinedLogPath, formattedMessage);

    // Write errors to separate file
    if (level === "error") {
      this.writeToFile(this.errorLogPath, formattedMessage);
    }

    // Console output with colors (development only)
    if (process.env.NODE_ENV !== "production") {
      const color = colors[level] || colors.reset;
      console.log(
        `${color}[${new Date().toISOString()}] [${level.toUpperCase()}]:${colors.reset}`,
        message,
        Object.keys(meta).length > 0 ? meta : "",
      );
    }
  }

  error(message, meta) {
    this.log("error", message, meta);
  }

  warn(message, meta) {
    this.log("warn", message, meta);
  }

  info(message, meta) {
    this.log("info", message, meta);
  }

  debug(message, meta) {
    this.log("debug", message, meta);
  }
}

module.exports = new Logger();
