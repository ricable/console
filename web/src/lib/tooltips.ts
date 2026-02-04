/**
 * Tooltip text definitions for technical abbreviations and terms
 */

export const TOOLTIPS = {
  // Kubernetes abbreviations
  CPU: 'Central Processing Unit - compute processing capacity',
  GPU: 'Graphics Processing Unit - specialized processor for parallel computations',
  RAM: 'Random Access Memory - volatile memory for active processes',
  RBAC: 'Role-Based Access Control - permission management system',
  CRD: 'Custom Resource Definition - extends Kubernetes API with custom resources',
  PVC: 'Persistent Volume Claim - request for storage resources',
  PV: 'Persistent Volume - storage resource in the cluster',
  
  // ConfigMaps and Secrets
  ConfigMap: 'ConfigMap - configuration data stored as key-value pairs',
  ConfigMaps: 'ConfigMaps - configuration data stored as key-value pairs',
  Secret: 'Secret - sensitive data stored with base64 encoding',
  Secrets: 'Secrets - sensitive data stored with base64 encoding',
  
  // Pod states and reasons
  CrashLoopBackOff: 'CrashLoopBackOff - container repeatedly crashes after starting',
  OOMKilled: 'Out Of Memory Killed - container exceeded memory limit and was terminated',
  Pending: 'Pending - pod is waiting to be scheduled or for containers to start',
  ContainerCreating: 'ContainerCreating - container images are being pulled or containers are being created',
  
  // Status indicators
  STATUS_HEALTHY: 'Healthy - resource is operating normally',
  STATUS_ERROR: 'Error - resource has encountered a critical problem',
  STATUS_WARNING: 'Warning - resource may have non-critical issues',
  STATUS_CRITICAL: 'Critical - resource requires immediate attention',
  STATUS_PENDING: 'Pending - resource is waiting to be processed',
  STATUS_LOADING: 'Loading - resource status is being retrieved',
  STATUS_UNKNOWN: 'Unknown - resource status cannot be determined',
  STATUS_UNREACHABLE: 'Unreachable - resource cannot be contacted',
  
  // Other terms
  OLM: 'Operator Lifecycle Manager - manages Kubernetes operators',
} as const

/**
 * Get tooltip text for an abbreviation or term
 */
export function getTooltip(key: keyof typeof TOOLTIPS): string {
  return TOOLTIPS[key]
}

/**
 * Wrap text with tooltip using title attribute
 */
export function withTooltip(text: string, tooltip: string): { text: string; title: string } {
  return { text, title: tooltip }
}
