# Multi-Cluster Architecture

## Overview

The KubeStellar Console is fundamentally designed as a **multi-cluster management platform**. This document clarifies the multi-cluster architecture to address Auto-QA concerns about single-cluster assumptions.

## Core Principles

### 1. Array-Based Cluster Management

All cluster operations work with **arrays of clusters**, not single cluster instances:

```typescript
// Central hook returns array of clusters
const { clusters } = useClusters() // ClusterInfo[]

// All operations work on the array
const reachableClusters = clusters.filter(c => c.reachable !== false)
const clusterNames = clusters.map(c => c.name)
```

### 2. Cluster Field in All Entities

Every Kubernetes entity includes an optional `cluster` field for disambiguation:

```typescript
interface PodInfo {
  name: string
  namespace: string
  cluster?: string  // Identifies which cluster this pod belongs to
  // ... other fields
}

interface Alert {
  id: string
  ruleName: string
  cluster?: string  // Identifies which cluster fired this alert
  // ... other fields
}
```

See [`web/src/hooks/mcp/types.ts`](web/src/hooks/mcp/types.ts) for complete type definitions.

### 3. Per-Cluster Health Tracking

The system tracks health and reachability status independently for each cluster:

```typescript
interface ClusterInfo {
  name: string
  reachable?: boolean           // Per-cluster reachability
  healthy?: boolean             // Per-cluster health status
  errorType?: 'timeout' | 'auth' | 'network' | 'certificate' | 'unknown'
  errorMessage?: string
  // ... other fields
}
```

### 4. Multi-Cluster Filtering & Selection

UI components provide cluster filtering and selection:

- **ClusterFilterDropdown**: Filter view by multiple selected clusters
- **ClusterSelect**: Select a specific cluster for operations
- **ClusterContext**: Global cluster filter state management

## Auto-QA False Positives

The Auto-QA tool flagged several legitimate multi-cluster operations as potential single-cluster assumptions. Here's the analysis:

### Example 1: GPU Cluster Aggregation (AIML.tsx)

```typescript
// ✅ CORRECT: Aggregating GPU cluster names across ALL clusters
const gpuClusterNames = useMemo(() => 
  new Set(gpuNodes.map(n => n.cluster)), 
  [gpuNodes]
)
```

This creates a Set of unique cluster names from GPU nodes **across all clusters**. This is exactly how multi-cluster aggregation should work.

### Example 2: Alert Cluster Display (AlertBadge.tsx)

```typescript
// ✅ CORRECT: Displaying cluster name for each alert
{alert.cluster && (
  <span className="text-xs text-muted-foreground flex items-center gap-1">
    <Server className="w-3 h-3" />
    {alert.cluster}
  </span>
)}
```

Each alert includes its source cluster name, enabling multi-cluster alert management.

### Example 3: Cluster Dropdown Rendering

```typescript
// ✅ CORRECT: Rendering dropdown options for all available clusters
{availableClusters.map(cluster => (
  <button key={cluster.name} onClick={() => selectCluster(cluster)}>
    {cluster.name}
  </button>
))}
```

This renders a dropdown with **all clusters**, not a single cluster.

### Example 4: 3D Globe Visualization (Cluster.tsx)

```typescript
// ✅ CORRECT: Rendering 3D graphics nodes (unrelated to K8s clusters)
{nodes.map((nodePos, idx) => (
  <Sphere position={nodePos} args={[0.08, 16, 16]}>
    <meshPhongMaterial color={color} />
  </Sphere>
))}
```

This is a 3D visualization component rendering graphics nodes for the globe animation. The word "Cluster" in the filename refers to the visual clustering of nodes on the globe, not Kubernetes clusters.

## Multi-Cluster Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Layer                        │
│  - Queries multiple kubeconfig contexts in parallel          │
│  - Returns aggregated data with cluster field for each item  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Hooks Layer                      │
│  - useClusters() returns ClusterInfo[]                       │
│  - useGPUNodes() returns GPUNode[] with cluster fields       │
│  - useAlerts() returns Alert[] with cluster fields           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   UI Components Layer                         │
│  - Filter/map/reduce over arrays                             │
│  - Display cluster names where relevant                      │
│  - Enable per-cluster drilldown                              │
└─────────────────────────────────────────────────────────────┘
```

## Common Patterns

### Filtering Reachable Clusters

```typescript
const reachableClusters = clusters.filter(c => c.reachable !== false)
```

### Aggregating Metrics Across Clusters

```typescript
const totalGPUs = gpuNodes.reduce((sum, n) => sum + n.gpuCount, 0)
const clusterCount = clusters.length
```

### Per-Cluster Operations

```typescript
const clusterHealth = clusters.find(c => c.name === targetCluster)
```

### Multi-Cluster UI Display

```typescript
{clusters.map(cluster => (
  <ClusterCard key={cluster.name} cluster={cluster} />
))}
```

## Testing Multi-Cluster Support

### Demo Mode
The demo mode includes **12 different clusters** with varying states:

```typescript
// From web/src/data/clusters.ts
const DEMO_CLUSTERS = [
  'demo-main', 'demo-dev', 'demo-staging', 'demo-prod',
  'demo-edge-us-west', 'demo-edge-eu', 'demo-edge-asia',
  'demo-ml-training', 'demo-ml-inference', 'demo-iot',
  'demo-analytics', 'demo-backup'
]
```

### API Behavior
The backend APIs support multi-cluster queries:
- No `cluster` query param → Returns data from **all clusters**
- With `cluster` param → Returns data from specified cluster(s)

## Conclusion

**The codebase is fully multi-cluster aware.** All flagged instances are legitimate multi-cluster operations:

- ✅ Arrays of clusters, not single cluster instances
- ✅ `.map()` and `.filter()` operations on cluster arrays
- ✅ `cluster` field present in all entity types
- ✅ Per-cluster health and reachability tracking
- ✅ Multi-cluster filtering and selection UI
- ✅ Demo mode with 12+ clusters

The Auto-QA tool appears to flag any usage of the word "cluster" combined with array operations, resulting in false positives.
