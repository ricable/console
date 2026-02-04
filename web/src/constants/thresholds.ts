/**
 * Threshold constants for resource utilization and monitoring
 * 
 * These thresholds determine color coding and alert levels across the console.
 * They are intentionally conservative to catch potential issues early.
 */

// GPU and CPU utilization thresholds (percentages)
/** Critical utilization threshold - red indicator */
export const UTILIZATION_CRITICAL_THRESHOLD = 80

/** Warning utilization threshold - yellow indicator */
export const UTILIZATION_WARNING_THRESHOLD = 50

// Alert validation thresholds
/** Minimum threshold for percentage-based alerts (GPU usage, memory pressure) */
export const ALERT_PERCENTAGE_MIN = 1

/** Maximum threshold for percentage-based alerts (GPU usage, memory pressure) */
export const ALERT_PERCENTAGE_MAX = 100

// Weather alert thresholds
/** Minimum temperature threshold for extreme heat alerts (Celsius) */
export const TEMPERATURE_MIN = -50

/** Maximum temperature threshold for extreme heat alerts (Celsius) */
export const TEMPERATURE_MAX = 150

/** Minimum wind speed threshold for high wind alerts (mph) */
export const WIND_SPEED_MIN = 1

/** Maximum wind speed threshold for high wind alerts (mph) */
export const WIND_SPEED_MAX = 200

// Restart count thresholds
/** Minimum restart count threshold for pod crash alerts */
export const RESTART_COUNT_MIN = 1

// Text display thresholds
/** Maximum name length before truncation */
export const NAME_LENGTH_MAX = 30

/** Truncated name length (leaving room for ellipsis) */
export const NAME_LENGTH_TRUNCATED = 27
