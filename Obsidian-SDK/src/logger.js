/**
 * Simple logger for Obsidian SDK
 */
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    this.currentLevel = process.env.LOG_LEVEL || 'info';
  }

  formatMessage(level, message, data = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    });
  }

  error(message, data = {}) {
    if (this.levels[this.currentLevel] >= this.levels.error) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  warn(message, data = {}) {
    if (this.levels[this.currentLevel] >= this.levels.warn) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  info(message, data = {}) {
    if (this.levels[this.currentLevel] >= this.levels.info) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  debug(message, data = {}) {
    if (this.levels[this.currentLevel] >= this.levels.debug) {
      console.log(this.formatMessage('debug', message, data));
    }
  }
}

export default new Logger();