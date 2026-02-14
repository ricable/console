// KubeStellar theme colors - use CSS variables for consistency
const getCSSVariable = (name: string, fallback: string): string => {
  if (typeof window !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value || fallback
  }
  return fallback
}

export const COLORS = {
  primary: getCSSVariable('--globe-primary', '#1a90ff'),
  secondary: getCSSVariable('--globe-secondary', '#6236FF'),
  highlight: getCSSVariable('--globe-highlight', '#00C2FF'),
  success: getCSSVariable('--globe-success', '#00E396'),
  background: getCSSVariable('--globe-background', '#0a0f1c'),
  accent1: getCSSVariable('--globe-accent1', '#FF5E84'),
  accent2: getCSSVariable('--globe-accent2', '#FFD166'),
  aiTraining: getCSSVariable('--globe-ai-training', '#B83FF7'),
  aiInference: getCSSVariable('--globe-ai-inference', '#00D6E4'),
}
