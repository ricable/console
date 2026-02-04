/**
 * Time interval constants for polling, caching, and time-based operations
 * 
 * All values are in milliseconds unless otherwise noted.
 */

// Time unit constants
/** Milliseconds in one second */
export const MS_PER_SECOND = 1000

/** Milliseconds in one minute */
export const MS_PER_MINUTE = 60 * MS_PER_SECOND

/** Milliseconds in one hour */
export const MS_PER_HOUR = 60 * MS_PER_MINUTE

/** Milliseconds in one day */
export const MS_PER_DAY = 24 * MS_PER_HOUR

// Time display thresholds
/** Threshold for switching from minutes to hours display */
export const TIME_DISPLAY_HOUR_THRESHOLD_MINS = 60

/** Threshold for switching from hours to days display */
export const TIME_DISPLAY_DAY_THRESHOLD_HOURS = 24

/** Threshold for switching from days to date display */
export const TIME_DISPLAY_DATE_THRESHOLD_DAYS = 7

// Auto-reload and snooze durations
/** Duration to snooze agent setup dialog (24 hours in milliseconds) */
export const AGENT_SETUP_SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000

/** Minimum time between auto-reloads to prevent infinite loops (30 seconds in milliseconds) */
export const CHUNK_ERROR_RELOAD_TIMEOUT_MS = 30_000

// Event display constants
/** Number of hours to display in event timeline */
export const EVENT_TIMELINE_HOURS = 24

/** Maximum number of events to display in summary view before "view more" */
export const EVENT_SUMMARY_DISPLAY_LIMIT = 10
