import { ComponentType } from 'react'
import {
  AlertTriangle, Box, Activity, Database, Server, Cpu, Network, Shield, Package, GitBranch, FileCode, Gauge, AlertCircle, Layers, HardDrive, Globe, Users, Terminal, TrendingUp, Gamepad2, Puzzle, Target, Zap, Crown, Ghost, Bird, Rocket, Wand2, Clock,
} from 'lucide-react'

/**
 * Card titles registry - maps card type IDs to display titles
 */
export const CARD_TITLES: Record<string, string> = {
  // Core cluster cards
  cluster_health: 'Cluster Health',
  cluster_focus: 'Cluster Focus',
  cluster_network: 'Cluster Network',
  cluster_comparison: 'Cluster Comparison',
  cluster_costs: 'Cluster Costs',
  cluster_metrics: 'Cluster Metrics',
  cluster_locations: 'Cluster Locations',
  cluster_resource_tree: 'Cluster Resource Tree',

  // Workload and deployment cards
  app_status: 'Workload Status',
  workload_deployment: 'Workloads',
  deployment_missions: 'Deployment Missions',
  deployment_progress: 'Deployment Progress',
  deployment_status: 'Deployment Status',
  deployment_issues: 'Deployment Issues',
  cluster_groups: 'Cluster Groups',
  resource_marshall: 'Resource Marshall',
  workload_monitor: 'Workload Monitor',
  llmd_stack_monitor: 'llm-d Stack Monitor',
  prow_ci_monitor: 'Prow CI Monitor',
  github_ci_monitor: 'GitHub CI Monitor',
  cluster_health_monitor: 'Cluster Health Monitor',

  // Pod and resource cards
  pod_issues: 'Pod Issues',
  top_pods: 'Top Pods',
  resource_capacity: 'Resource Capacity',
  resource_usage: 'Resource Allocation',
  compute_overview: 'Compute Overview',

  // Events
  event_stream: 'Event Stream',
  event_summary: 'Event Summary',
  warning_events: 'Warning Events',
  recent_events: 'Recent Events',
  events_timeline: 'Events Timeline',

  // Trend cards
  pod_health_trend: 'Pod Health Trend',
  resource_trend: 'Resource Trend',

  // Storage and network
  storage_overview: 'Storage Overview',
  pvc_status: 'PVC Status',
  network_overview: 'Network Overview',
  service_status: 'Service Status',

  // Namespace cards
  namespace_overview: 'Namespace Overview',
  namespace_analysis: 'Namespace Analysis',
  namespace_rbac: 'Namespace RBAC',
  namespace_quotas: 'Namespace Quotas',
  namespace_events: 'Namespace Events',
  namespace_monitor: 'Namespace Monitor',

  // Operator cards
  operator_status: 'Operator Status',
  operator_subscriptions: 'Operator Subscriptions',
  crd_health: 'CRD Health',

  // Helm/GitOps cards
  gitops_drift: 'GitOps Drift',
  helm_release_status: 'Helm Release Status',
  helm_releases: 'Helm Releases',
  helm_history: 'Helm History',
  helm_values_diff: 'Helm Values Diff',
  kustomization_status: 'Kustomization Status',
  overlay_comparison: 'Overlay Comparison',
  chart_versions: 'Helm Chart Versions',

  // ArgoCD cards
  argocd_applications: 'ArgoCD Applications',
  argocd_sync_status: 'ArgoCD Sync Status',
  argocd_health: 'ArgoCD Health',

  // GPU cards
  gpu_overview: 'GPU Overview',
  gpu_status: 'GPU Status',
  gpu_inventory: 'GPU Inventory',
  gpu_workloads: 'GPU Workloads',
  gpu_utilization: 'GPU Utilization',
  gpu_usage_trend: 'GPU Usage Trend',

  // Security, RBAC, and compliance
  security_issues: 'Security Issues',
  rbac_overview: 'RBAC Overview',
  policy_violations: 'Policy Violations',
  opa_policies: 'OPA Policies',
  kyverno_policies: 'Kyverno Policies',
  falco_alerts: 'Falco Alerts',
  trivy_scan: 'Trivy Scan',
  kubescape_scan: 'Kubescape Scan',
  compliance_score: 'Compliance Score',
  vault_secrets: 'Vault Secrets',
  external_secrets: 'External Secrets',
  cert_manager: 'Cert Manager',

  // Alerting cards
  active_alerts: 'Active Alerts',
  alert_rules: 'Alert Rules',

  // Cost management
  opencost_overview: 'OpenCost Overview',
  kubecost_overview: 'Kubecost Overview',

  // MCS (Multi-Cluster Service) cards
  service_exports: 'Service Exports',
  service_imports: 'Service Imports',
  gateway_status: 'Gateway Status',
  service_topology: 'Service Topology',

  // Other
  upgrade_status: 'Cluster Upgrade Status',
  user_management: 'User Management',
  github_activity: 'GitHub Activity',
  kubectl: 'Kubectl Terminal',
  weather: 'Weather',
  rss_feed: 'RSS Feed',
  iframe_embed: 'Iframe Embed',
  network_utils: 'Network Utils',
  mobile_browser: 'Mobile Browser',

  // AI cards
  console_ai_issues: 'AI Issues',
  console_ai_kubeconfig_audit: 'AI Kubeconfig Audit',
  console_ai_health_check: 'AI Health Check',
  console_ai_offline_detection: 'AI Offline Detection',

  // Stock Market Ticker
  stock_market_ticker: 'Stock Market Ticker',

  // Prow CI/CD cards
  prow_jobs: 'Prow Jobs',
  prow_status: 'Prow Status',
  prow_history: 'Prow History',

  // ML/AI workload cards
  llm_inference: 'llm-d Inference',
  llm_models: 'llm-d Models',
  ml_jobs: 'ML Jobs',
  ml_notebooks: 'ML Notebooks',

  // Games
  sudoku_game: 'Sudoku Game',
  match_game: 'Kube Match',
  solitaire: 'Kube Solitaire',
  checkers: 'AI Checkers',
  game_2048: 'Kube 2048',
  kubedle: 'Kubedle',
  pod_sweeper: 'Pod Sweeper',
  container_tetris: 'Container Tetris',
  flappy_pod: 'Flappy Pod',
  kube_man: 'Kube-Man',
  kube_kong: 'Kube Kong',
  pod_pitfall: 'Pod Pitfall',
  node_invaders: 'Node Invaders',
  pod_crosser: 'Pod Crosser',
  pod_brothers: 'Pod Brothers',
  kube_kart: 'Kube Kart',
  kube_pong: 'Kube Pong',
  kube_snake: 'Kube Snake',
  kube_galaga: 'Kube Galaga',
  kube_doom: 'Kube Doom',
  kube_craft: 'Kube Craft',
  kube_chess: 'Kube Chess',

  // Provider health
  provider_health: 'Provider Health',
}

/**
 * Card descriptions registry - maps card type IDs to descriptive text
 */
export const CARD_DESCRIPTIONS: Record<string, string> = {
  cluster_health: 'Overall health status of all connected Kubernetes clusters.',
  cluster_focus: 'Deep-dive view of a single cluster with key metrics and resources.',
  cluster_network: 'Network connectivity and traffic flow between clusters.',
  cluster_comparison: 'Side-by-side comparison of clusters by resource usage and health.',
  cluster_costs: 'Estimated infrastructure costs broken down by cluster.',
  cluster_metrics: 'Real-time CPU, memory, and pod metrics across clusters.',
  cluster_locations: 'Geographic map of cluster locations worldwide.',
  cluster_resource_tree: 'Hierarchical tree view of all resources in a cluster.',
  app_status: 'Status of workloads across clusters with health indicators.',
  workload_deployment: 'Deploy workloads to clusters using drag-and-drop.',
  deployment_missions: 'Track multi-cluster deployment missions and their progress.',
  deployment_progress: 'Real-time deployment rollout progress and status.',
  deployment_status: 'Detailed status of deployments including replicas and conditions.',
  deployment_issues: 'Active deployment problems such as failed rollouts or image pull errors.',
  cluster_groups: 'Organize clusters into logical groups for targeted deployments.',
  resource_marshall: 'Explore resource dependency trees and ownership chains.',
  workload_monitor: 'Monitor all resources for a workload with health status, alerts, and AI diagnose/repair.',
  llmd_stack_monitor: 'Monitor the llm-d inference stack: model serving, EPP, gateways, and autoscalers.',
  prow_ci_monitor: 'Monitor Prow CI jobs with success rates, failure analysis, and AI repair.',
  github_ci_monitor: 'Monitor GitHub Actions workflows across repos with pass rates and alerts.',
  cluster_health_monitor: 'Monitor cluster health across all connected clusters with pod and deployment issues.',
  pod_issues: 'Pods with errors, restarts, or scheduling problems.',
  top_pods: 'Top resource-consuming pods ranked by CPU or memory usage.',
  resource_capacity: 'Cluster resource capacity vs. current allocation.',
  resource_usage: 'CPU and memory allocation breakdown across clusters.',
  compute_overview: 'Summary of compute resources: nodes, CPUs, and memory.',
  event_stream: 'Live stream of Kubernetes events from all clusters.',
  event_summary: 'Aggregated event counts grouped by type and reason.',
  warning_events: 'Warning-level events that may need attention.',
  recent_events: 'Most recent events across all clusters.',
  events_timeline: 'Timeline chart of event frequency over time.',
  pod_health_trend: 'Historical trend of pod health status over time.',
  resource_trend: 'Resource usage trends showing CPU and memory over time.',
  storage_overview: 'Persistent volume and storage class overview.',
  pvc_status: 'Status of Persistent Volume Claims across clusters.',
  network_overview: 'Network policies, services, and ingress summary.',
  service_status: 'Status of Kubernetes services and their endpoints.',
  namespace_overview: 'Summary of resources within a namespace.',
  namespace_analysis: 'Detailed analysis of namespace health and resource usage.',
  namespace_rbac: 'RBAC roles and bindings within a namespace.',
  namespace_quotas: 'Resource quota utilization within a namespace.',
  namespace_events: 'Events filtered to a specific namespace.',
  namespace_monitor: 'Real-time monitoring of namespace resource trends.',
  operator_status: 'Status of installed Kubernetes operators.',
  operator_subscriptions: 'Operator subscriptions and update channels.',
  crd_health: 'Health and status of Custom Resource Definitions.',
  gitops_drift: 'Drift detection between Git source and live cluster state.',
  helm_release_status: 'Status of Helm releases across clusters.',
  helm_releases: 'List of all deployed Helm releases.',
  helm_history: 'Historical rollout and revision history for Helm releases.',
  helm_values_diff: 'Compare values between Helm releases or revisions.',
  kustomization_status: 'Status of Kustomization resources for GitOps deployments.',
  overlay_comparison: 'Compare Kustomize overlays side-by-side.',
  chart_versions: 'Available Helm chart versions and upgrade paths.',
  argocd_applications: 'ArgoCD applications and their deployment status.',
  argocd_sync_status: 'Sync status of ArgoCD-managed applications.',
  argocd_health: 'Health status of ArgoCD-managed applications.',
  gpu_overview: 'Summary of GPU resources across clusters.',
  gpu_status: 'Status of individual GPUs including utilization and health.',
  gpu_inventory: 'Inventory of all GPU nodes and their capabilities.',
  gpu_workloads: 'Workloads running on GPU nodes.',
  gpu_utilization: 'Real-time GPU utilization metrics.',
  gpu_usage_trend: 'Historical GPU usage trends over time.',
  security_issues: 'Security vulnerabilities and misconfigurations.',
  rbac_overview: 'Overview of RBAC roles and bindings.',
  policy_violations: 'Policy violations detected by admission controllers.',
  opa_policies: 'Open Policy Agent policies and their enforcement status.',
  kyverno_policies: 'Kyverno policy reports and violations.',
  falco_alerts: 'Runtime security alerts from Falco.',
  trivy_scan: 'Container vulnerability scan results from Trivy.',
  kubescape_scan: 'Kubernetes security posture scan results.',
  compliance_score: 'Overall compliance score based on security scans.',
  vault_secrets: 'HashiCorp Vault secret status and sync.',
  external_secrets: 'External Secrets Operator status and sync.',
  cert_manager: 'Certificate Manager status and certificate health.',
  active_alerts: 'Currently firing alerts from Prometheus AlertManager.',
  alert_rules: 'Configured alert rules and their status.',
  opencost_overview: 'Cost insights from OpenCost for Kubernetes resources.',
  kubecost_overview: 'Cost allocation and savings insights from Kubecost.',
  service_exports: 'Services exported for multi-cluster connectivity.',
  service_imports: 'Services imported from other clusters.',
  gateway_status: 'Status of multi-cluster gateway connections.',
  service_topology: 'Visual topology of service dependencies across clusters.',
  upgrade_status: 'Kubernetes cluster upgrade status and available versions.',
  user_management: 'Manage users, roles, and permissions.',
  github_activity: 'Recent activity from GitHub repositories.',
  kubectl: 'Interactive kubectl terminal for cluster management.',
  weather: 'Current weather conditions.',
  rss_feed: 'RSS feed reader for staying updated.',
  iframe_embed: 'Embed external web content in a card.',
  network_utils: 'Network diagnostic tools like ping, traceroute, and DNS lookup.',
  mobile_browser: 'Preview websites in mobile and tablet viewports.',
  console_ai_issues: 'AI-detected issues and recommended fixes.',
  console_ai_kubeconfig_audit: 'AI audit of kubeconfig security and best practices.',
  console_ai_health_check: 'AI-powered cluster health check and recommendations.',
  console_ai_offline_detection: 'AI detection of offline clusters and degraded resources.',
  stock_market_ticker: 'Real-time stock market data and trends.',
  prow_jobs: 'Prow CI job history and status.',
  prow_status: 'Current status of Prow CI infrastructure.',
  prow_history: 'Historical Prow job results and trends.',
  llm_inference: 'llm-d inference service status and metrics.',
  llm_models: 'Available llm-d models and their deployment status.',
  ml_jobs: 'Machine learning training jobs and their status.',
  ml_notebooks: 'Jupyter notebook sessions for ML experimentation.',
  sudoku_game: 'Play Sudoku with Kubernetes-themed styling.',
  match_game: 'Memory matching game with Kubernetes icons.',
  solitaire: 'Classic Solitaire with a Kubernetes twist.',
  checkers: 'Play Checkers against an AI opponent.',
  game_2048: '2048 game with Kubernetes resource labels.',
  kubedle: 'Wordle-style game for Kubernetes commands.',
  pod_sweeper: 'Minesweeper-style game themed around pods.',
  container_tetris: 'Tetris game themed around container scheduling.',
  flappy_pod: 'Flappy Bird-style game with flying pods.',
  kube_man: 'Pac-Man-style game in a Kubernetes cluster.',
  kube_kong: 'Donkey Kong-style platformer game.',
  pod_pitfall: 'Pitfall-style adventure game.',
  node_invaders: 'Space Invaders with node themes.',
  pod_crosser: 'Frogger-style game crossing pod traffic.',
  pod_brothers: 'Super Mario Bros-style platformer.',
  kube_kart: 'Mario Kart-style racing game.',
  kube_pong: 'Classic Pong game.',
  kube_snake: 'Snake game with Kubernetes themes.',
  kube_galaga: 'Galaga-style space shooter.',
  kube_doom: 'DOOM-style first-person shooter.',
  kube_craft: 'Minecraft-style building game.',
  kube_chess: 'Chess game with strategic gameplay.',
  provider_health: 'Health status of cloud provider APIs and services.',
}

/**
 * Card icons registry - maps card type IDs to Lucide icons with colors
 */
export const CARD_ICONS: Record<string, { icon: ComponentType<{ className?: string }>, color: string }> = {
  // Core cluster cards
  cluster_health: { icon: Activity, color: 'text-green-400' },
  cluster_focus: { icon: Server, color: 'text-purple-400' },
  cluster_network: { icon: Network, color: 'text-cyan-400' },
  cluster_comparison: { icon: Layers, color: 'text-blue-400' },
  cluster_costs: { icon: TrendingUp, color: 'text-emerald-400' },
  cluster_metrics: { icon: Activity, color: 'text-purple-400' },
  cluster_locations: { icon: Globe, color: 'text-blue-400' },

  // Workload and deployment cards
  app_status: { icon: Box, color: 'text-purple-400' },
  deployment_missions: { icon: Rocket, color: 'text-blue-400' },
  deployment_progress: { icon: Clock, color: 'text-blue-400' },
  deployment_status: { icon: Box, color: 'text-purple-400' },
  deployment_issues: { icon: AlertTriangle, color: 'text-orange-400' },

  // Pod and resource cards
  pod_issues: { icon: AlertTriangle, color: 'text-orange-400' },
  top_pods: { icon: Box, color: 'text-purple-400' },
  resource_capacity: { icon: Gauge, color: 'text-blue-400' },
  resource_usage: { icon: Gauge, color: 'text-purple-400' },
  pod_health_trend: { icon: Box, color: 'text-purple-400' },
  resource_trend: { icon: TrendingUp, color: 'text-blue-400' },

  // Events
  event_stream: { icon: Activity, color: 'text-blue-400' },
  events_timeline: { icon: Clock, color: 'text-purple-400' },

  // Namespace cards
  namespace_overview: { icon: Layers, color: 'text-purple-400' },
  namespace_analysis: { icon: Layers, color: 'text-purple-400' },
  namespace_rbac: { icon: Shield, color: 'text-yellow-400' },
  namespace_quotas: { icon: Gauge, color: 'text-yellow-400' },
  namespace_events: { icon: Activity, color: 'text-blue-400' },
  namespace_monitor: { icon: Activity, color: 'text-purple-400' },

  // Operator cards
  operator_status: { icon: Package, color: 'text-purple-400' },
  operator_subscriptions: { icon: Package, color: 'text-purple-400' },
  crd_health: { icon: Database, color: 'text-teal-400' },

  // Helm/GitOps cards
  gitops_drift: { icon: GitBranch, color: 'text-purple-400' },
  helm_release_status: { icon: Package, color: 'text-blue-400' },
  helm_releases: { icon: Package, color: 'text-blue-400' },
  helm_history: { icon: Clock, color: 'text-purple-400' },
  helm_values_diff: { icon: FileCode, color: 'text-yellow-400' },
  kustomization_status: { icon: Layers, color: 'text-purple-400' },
  overlay_comparison: { icon: Layers, color: 'text-blue-400' },
  chart_versions: { icon: Package, color: 'text-emerald-400' },

  // ArgoCD cards
  argocd_applications: { icon: GitBranch, color: 'text-orange-400' },
  argocd_sync_status: { icon: GitBranch, color: 'text-orange-400' },
  argocd_health: { icon: Activity, color: 'text-orange-400' },

  // GPU cards
  gpu_overview: { icon: Cpu, color: 'text-green-400' },
  gpu_status: { icon: Cpu, color: 'text-green-400' },
  gpu_inventory: { icon: Cpu, color: 'text-green-400' },
  gpu_workloads: { icon: Cpu, color: 'text-green-400' },
  gpu_usage_trend: { icon: Cpu, color: 'text-green-400' },
  gpu_utilization: { icon: Cpu, color: 'text-green-400' },

  // Security and RBAC
  security_issues: { icon: Shield, color: 'text-red-400' },
  rbac_overview: { icon: Shield, color: 'text-yellow-400' },
  policy_violations: { icon: AlertTriangle, color: 'text-red-400' },
  opa_policies: { icon: Shield, color: 'text-purple-400' },
  kyverno_policies: { icon: Shield, color: 'text-blue-400' },
  alert_rules: { icon: AlertCircle, color: 'text-orange-400' },
  active_alerts: { icon: AlertTriangle, color: 'text-red-400' },

  // Storage
  pvc_status: { icon: HardDrive, color: 'text-blue-400' },
  storage_overview: { icon: Database, color: 'text-purple-400' },

  // Network
  network_overview: { icon: Network, color: 'text-cyan-400' },
  service_status: { icon: Server, color: 'text-purple-400' },
  service_topology: { icon: Network, color: 'text-blue-400' },
  service_exports: { icon: Server, color: 'text-green-400' },
  service_imports: { icon: Server, color: 'text-blue-400' },
  gateway_status: { icon: Network, color: 'text-purple-400' },

  // Compute
  compute_overview: { icon: Cpu, color: 'text-purple-400' },

  // Other
  upgrade_status: { icon: TrendingUp, color: 'text-blue-400' },
  user_management: { icon: Users, color: 'text-purple-400' },
  github_activity: { icon: Activity, color: 'text-purple-400' },
  kubectl: { icon: Terminal, color: 'text-green-400' },
  weather: { icon: Globe, color: 'text-blue-400' },
  stock_market_ticker: { icon: TrendingUp, color: 'text-green-400' },

  // AI cards
  console_ai_issues: { icon: Wand2, color: 'text-purple-400' },
  console_ai_kubeconfig_audit: { icon: Wand2, color: 'text-purple-400' },
  console_ai_health_check: { icon: Wand2, color: 'text-purple-400' },

  // Cost cards
  opencost_overview: { icon: TrendingUp, color: 'text-emerald-400' },
  kubecost_overview: { icon: TrendingUp, color: 'text-emerald-400' },

  // Compliance and security tools
  falco_alerts: { icon: AlertTriangle, color: 'text-red-400' },
  trivy_scan: { icon: Shield, color: 'text-blue-400' },
  kubescape_scan: { icon: Shield, color: 'text-purple-400' },
  compliance_score: { icon: Shield, color: 'text-green-400' },

  // Data compliance
  vault_secrets: { icon: Shield, color: 'text-yellow-400' },
  external_secrets: { icon: Shield, color: 'text-blue-400' },
  cert_manager: { icon: Shield, color: 'text-green-400' },

  // Prow CI cards
  prow_jobs: { icon: Activity, color: 'text-blue-400' },
  prow_status: { icon: Activity, color: 'text-green-400' },
  prow_history: { icon: Clock, color: 'text-purple-400' },

  // ML/AI workload cards
  llm_inference: { icon: Cpu, color: 'text-purple-400' },
  llm_models: { icon: Database, color: 'text-blue-400' },
  ml_jobs: { icon: Activity, color: 'text-orange-400' },
  ml_notebooks: { icon: FileCode, color: 'text-purple-400' },

  // Workload deployment
  workload_deployment: { icon: Box, color: 'text-blue-400' },

  // Workload Monitor cards
  workload_monitor: { icon: Package, color: 'text-purple-400' },
  llmd_stack_monitor: { icon: Cpu, color: 'text-purple-400' },
  prow_ci_monitor: { icon: Activity, color: 'text-blue-400' },
  github_ci_monitor: { icon: GitBranch, color: 'text-purple-400' },
  cluster_health_monitor: { icon: Server, color: 'text-green-400' },

  // Provider health
  provider_health: { icon: Activity, color: 'text-emerald-400' },

  // Games
  sudoku_game: { icon: Puzzle, color: 'text-purple-400' },
  match_game: { icon: Puzzle, color: 'text-purple-400' },
  solitaire: { icon: Gamepad2, color: 'text-red-400' },
  checkers: { icon: Crown, color: 'text-amber-400' },
  game_2048: { icon: Gamepad2, color: 'text-orange-400' },
  kubedle: { icon: Target, color: 'text-green-400' },
  pod_sweeper: { icon: Zap, color: 'text-red-400' },
  container_tetris: { icon: Gamepad2, color: 'text-cyan-400' },
  flappy_pod: { icon: Bird, color: 'text-yellow-400' },
  kube_man: { icon: Ghost, color: 'text-yellow-400' },
  kube_kong: { icon: Gamepad2, color: 'text-red-400' },
  pod_pitfall: { icon: Rocket, color: 'text-green-400' },
  node_invaders: { icon: Rocket, color: 'text-purple-400' },
  pod_brothers: { icon: Gamepad2, color: 'text-red-400' },
  kube_kart: { icon: Gamepad2, color: 'text-green-400' },
  kube_pong: { icon: Gamepad2, color: 'text-cyan-400' },
  kube_snake: { icon: Gamepad2, color: 'text-green-400' },
  kube_galaga: { icon: Rocket, color: 'text-blue-400' },
  kube_craft: { icon: Puzzle, color: 'text-brown-400' },
  kube_chess: { icon: Crown, color: 'text-amber-400' },
  kube_craft_3d: { icon: Puzzle, color: 'text-green-400' },

  // Utilities
  iframe_embed: { icon: Globe, color: 'text-blue-400' },
  network_utils: { icon: Network, color: 'text-cyan-400' },
  mobile_browser: { icon: Globe, color: 'text-purple-400' },
}

/**
 * Width options for card resizing
 */
export const WIDTH_OPTIONS = [
  { value: 3, label: 'Small', description: '1/4 width' },
  { value: 4, label: 'Medium', description: '1/3 width' },
  { value: 6, label: 'Large', description: '1/2 width' },
  { value: 8, label: 'Wide', description: '2/3 width' },
  { value: 12, label: 'Full', description: 'Full width' },
]

/**
 * Cards that need extra-large expanded modal (for maps, complex visualizations, etc.)
 */
export const LARGE_EXPANDED_CARDS = new Set([
  'cluster_comparison',
  'cluster_resource_tree',
  'match_game',
])

/**
 * Cards that should be nearly fullscreen when expanded
 */
export const FULLSCREEN_EXPANDED_CARDS = new Set([
  'cluster_locations',
  'sudoku_game',
  'mobile_browser',
])
