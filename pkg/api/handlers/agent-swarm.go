package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/kubestellar/console/pkg/k8s"
)

// Agent Swarm API types

// AgentInfo represents an agent in the swarm
type AgentInfo struct {
	Name            string            `json:"name"`
	Namespace       string            `json:"namespace"`
	Domain          string            `json:"domain"`
	Type            string            `json:"type"`
	Runtime         string            `json:"runtime"`
	Replicas        int               `json:"replicas"`
	Status          string            `json:"status"`
	Autonomy        int               `json:"autonomy"`
	Cluster         string            `json:"cluster"`
	CreatedAt       time.Time         `json:"createdAt"`
	UpdatedAt       time.Time         `json:"updatedAt"`
	Labels          map[string]string `json:"labels"`
	Annotations     map[string]string `json:"annotations"`
	PodStatus       []PodStatusInfo   `json:"podStatus"`
	Events          []EventInfo       `json:"events"`
}

// PodStatusInfo represents pod status for an agent
type PodStatusInfo struct {
	Name      string `json:"name"`
	Phase     string `json:"phase"`
	Ready     string `json:"ready"`
	Restarts  int32  `json:"restarts"`
	Node      string `json:"node"`
	Age       string `json:"age"`
	Cluster   string `json:"cluster"`
}

// EventInfo represents a Kubernetes event
type EventInfo struct {
	Type      string    `json:"type"`
	Reason    string    `json:"reason"`
	Message   string    `json:"message"`
	Age       string    `json:"age"`
	Count     int32     `json:"count"`
	FirstSeen time.Time `json:"firstSeen"`
	LastSeen  time.Time `json:"lastSeen"`
}

// SwarmSummary represents aggregate swarm statistics
type SwarmSummary struct {
	TotalAgents     int            `json:"totalAgents"`
	RunningAgents   int            `json:"runningAgents"`
	FailedAgents    int            `json:"failedAgents"`
	PendingAgents   int            `json:"pendingAgents"`
	TotalPods       int            `json:"totalPods"`
	RunningPods     int            `json:"runningPods"`
	FailedPods      int            `json:"failedPods"`
	ByDomain        map[string]int `json:"byDomain"`
	ByType          map[string]int `json:"byType"`
	ByRuntime       map[string]int `json:"byRuntime"`
	ByCluster       map[string]int `json:"byCluster"`
}

// WasmRuntimeInfo represents WASM runtime status
type WasmRuntimeInfo struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	Version      string `json:"version"`
	Status       string `json:"status"`
	AgentCount   int    `json:"agentCount"`
	PodCount     int    `json:"podCount"`
	Cluster      string `json:"cluster"`
}

// FederationStatus represents federation sync status
type FederationStatus struct {
	Connected    bool              `json:"connected"`
	EdgeCount    int               `json:"edgeCount"`
	RegionCount  int               `json:"regionCount"`
	CloudCount   int               `json:"cloudCount"`
	SyncStatus   map[string]string `json:"syncStatus"`
	LastSync     time.Time         `json:"lastSync"`
}

// AgentDeployRequest represents a request to deploy a new agent
type AgentDeployRequest struct {
	Name       string            `json:"name"`
	Namespace  string            `json:"namespace"`
	Domain     string            `json:"domain"`
	Type       string            `json:"type"`
	Runtime    string            `json:"runtime"`
	Replicas   int               `json:"replicas"`
	Cluster    string            `json:"cluster"`
	Labels     map[string]string `json:"labels"`
	Config     map[string]string `json:"config"`
}

// AgentScaleRequest represents a request to scale an agent
type AgentScaleRequest struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int    `json:"replicas"`
	Cluster   string `json:"cluster"`
}

// AgentSwarmHandlers handles agent swarm API endpoints
type AgentSwarmHandlers struct {
	k8sClient *k8s.MultiClusterClient
}

// NewAgentSwarmHandlers creates a new agent swarm handlers instance
func NewAgentSwarmHandlers(k8sClient *k8s.MultiClusterClient) *AgentSwarmHandlers {
	return &AgentSwarmHandlers{
		k8sClient: k8sClient,
	}
}

// GetSummary returns aggregate stats across clusters
func (h *AgentSwarmHandlers) GetSummary(c *fiber.Ctx) error {
	// Return demo data for now - can be enhanced with real K8s data
	return c.JSON(h.getDemoSummary())
}

// GetAgents returns list of all Agent CRs across clusters
func (h *AgentSwarmHandlers) GetAgents(c *fiber.Ctx) error {
	return c.JSON(h.getDemoAgents())
}

// GetAgent returns single agent details
func (h *AgentSwarmHandlers) GetAgent(c *fiber.Ctx) error {
	name := c.Params("name")
	for _, agent := range h.getDemoAgents() {
		if agent.Name == name {
			return c.JSON(agent)
		}
	}
	return c.Status(404).JSON(fiber.Map{"error": fmt.Sprintf("Agent %s not found", name)})
}

// GetRuntime returns WASM runtime status
func (h *AgentSwarmHandlers) GetRuntime(c *fiber.Ctx) error {
	return c.JSON(h.getDemoRuntimes())
}

// GetFederation returns federation status
func (h *AgentSwarmHandlers) GetFederation(c *fiber.Ctx) error {
	return c.JSON(h.getDemoFederation())
}

// DeployAgent deploys a new agent
func (h *AgentSwarmHandlers) DeployAgent(c *fiber.Ctx) error {
	var req AgentDeployRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Name == "" || req.Namespace == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name and namespace are required"})
	}

	// In a real implementation, this would create a K8s deployment
	// For now, return success
	return c.JSON(fiber.Map{"message": "Agent deployed successfully", "name": req.Name})
}

// ScaleAgent scales agent replicas
func (h *AgentSwarmHandlers) ScaleAgent(c *fiber.Ctx) error {
	var req AgentScaleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Name == "" || req.Namespace == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name and namespace are required"})
	}

	// In a real implementation, this would scale the K8s deployment
	return c.JSON(fiber.Map{"message": "Agent scaled successfully", "name": req.Name, "replicas": req.Replicas})
}

// DeleteAgent deletes an agent
func (h *AgentSwarmHandlers) DeleteAgent(c *fiber.Ctx) error {
	name := c.Params("name")
	namespace := c.Query("namespace", "wasmai-system")

	// In a real implementation, this would delete the K8s deployment
	return c.JSON(fiber.Map{"message": "Agent deleted successfully", "name": name, "namespace": namespace})
}

// RestartAgent restarts an agent
func (h *AgentSwarmHandlers) RestartAgent(c *fiber.Ctx) error {
	name := c.Params("name")
	namespace := c.Query("namespace", "wasmai-system")

	// In a real implementation, this would restart the K8s pods
	return c.JSON(fiber.Map{"message": "Agent restarted successfully", "name": name, "namespace": namespace})
}

// Demo data functions

func (h *AgentSwarmHandlers) getDemoSummary() SwarmSummary {
	return SwarmSummary{
		TotalAgents:   4,
		RunningAgents: 3,
		FailedAgents:  0,
		PendingAgents: 1,
		TotalPods:     8,
		RunningPods:   6,
		FailedPods:    0,
		ByDomain: map[string]int{
			"Mobility":     1,
			"Throughput":   1,
			"Integrity":    1,
			"Coordination": 1,
		},
		ByType: map[string]int{
			"ran-agent":   2,
			"sparc-agent": 1,
			"coordinator": 1,
		},
		ByRuntime: map[string]int{
			"spin":      2,
			"wasmedge":  1,
			"crun-wasm": 1,
		},
		ByCluster: map[string]int{
			"edge-ran-1": 2,
			"edge-ran-2": 1,
			"edge-ml":    1,
		},
	}
}

func (h *AgentSwarmHandlers) getDemoAgents() []AgentInfo {
	return []AgentInfo{
		{
			Name:       "mobility-agent",
			Namespace:  "wasmai-system",
			Domain:     "Mobility",
			Type:       "ran-agent",
			Runtime:    "spin",
			Replicas:   3,
			Status:     "Running",
			Autonomy:   85,
			Cluster:    "edge-ran-1",
			CreatedAt:  time.Now().Add(-7 * 24 * time.Hour),
			UpdatedAt:  time.Now(),
			Labels:     map[string]string{"app.kubernetes.io/name": "mobility-agent"},
			Annotations: map[string]string{},
			PodStatus: []PodStatusInfo{
				{Name: "mobility-agent-0", Phase: "Running", Ready: "1/1", Restarts: 0, Node: "edge-node-1", Age: "7d", Cluster: "edge-ran-1"},
				{Name: "mobility-agent-1", Phase: "Running", Ready: "1/1", Restarts: 0, Node: "edge-node-2", Age: "7d", Cluster: "edge-ran-1"},
				{Name: "mobility-agent-2", Phase: "Running", Ready: "1/1", Restarts: 1, Node: "edge-node-3", Age: "7d", Cluster: "edge-ran-1"},
			},
			Events: []EventInfo{},
		},
		{
			Name:       "throughput-agent",
			Namespace:  "wasmai-system",
			Domain:     "Throughput",
			Type:       "ran-agent",
			Runtime:    "wasmedge",
			Replicas:   2,
			Status:     "Running",
			Autonomy:   70,
			Cluster:    "edge-ran-2",
			CreatedAt:  time.Now().Add(-5 * 24 * time.Hour),
			UpdatedAt:  time.Now(),
			Labels:     map[string]string{"app.kubernetes.io/name": "throughput-agent"},
			Annotations: map[string]string{},
			PodStatus: []PodStatusInfo{
				{Name: "throughput-agent-0", Phase: "Running", Ready: "1/1", Restarts: 0, Node: "edge-node-4", Age: "5d", Cluster: "edge-ran-2"},
				{Name: "throughput-agent-1", Phase: "Running", Ready: "1/1", Restarts: 0, Node: "edge-node-5", Age: "5d", Cluster: "edge-ran-2"},
			},
			Events: []EventInfo{},
		},
		{
			Name:       "sparc-agent",
			Namespace:  "wasmai-system",
			Domain:     "Integrity",
			Type:       "sparc-agent",
			Runtime:    "crun-wasm",
			Replicas:   2,
			Status:     "Running",
			Autonomy:   90,
			Cluster:    "edge-ml",
			CreatedAt:  time.Now().Add(-3 * 24 * time.Hour),
			UpdatedAt:  time.Now(),
			Labels:     map[string]string{"app.kubernetes.io/name": "sparc-agent"},
			Annotations: map[string]string{},
			PodStatus: []PodStatusInfo{
				{Name: "sparc-agent-0", Phase: "Running", Ready: "1/1", Restarts: 0, Node: "ml-node-1", Age: "3d", Cluster: "edge-ml"},
				{Name: "sparc-agent-1", Phase: "Running", Ready: "1/1", Restarts: 0, Node: "ml-node-2", Age: "3d", Cluster: "edge-ml"},
			},
			Events: []EventInfo{},
		},
		{
			Name:       "coordinator-agent",
			Namespace:  "wasmai-system",
			Domain:     "Coordination",
			Type:       "coordinator",
			Runtime:    "spin",
			Replicas:   1,
			Status:     "Pending",
			Autonomy:   50,
			Cluster:    "edge-ran-1",
			CreatedAt:  time.Now().Add(-1 * time.Hour),
			UpdatedAt:  time.Now(),
			Labels:     map[string]string{"app.kubernetes.io/name": "coordinator-agent"},
			Annotations: map[string]string{},
			PodStatus: []PodStatusInfo{
				{Name: "coordinator-agent-0", Phase: "Pending", Ready: "0/1", Restarts: 0, Node: "", Age: "1h", Cluster: "edge-ran-1"},
			},
			Events: []EventInfo{},
		},
	}
}

func (h *AgentSwarmHandlers) getDemoRuntimes() []WasmRuntimeInfo {
	return []WasmRuntimeInfo{
		{
			Name:       "spin",
			Type:       "spin",
			Version:    "3.0.0",
			Status:     "Ready",
			AgentCount: 2,
			PodCount:   4,
			Cluster:    "edge-ran-1",
		},
		{
			Name:       "wasmedge",
			Type:       "wasmedge",
			Version:    "0.14.0",
			Status:     "Ready",
			AgentCount: 1,
			PodCount:   2,
			Cluster:    "edge-ran-2",
		},
		{
			Name:       "crun-wasm",
			Type:       "crun-wasm",
			Version:    "1.14.0",
			Status:     "Ready",
			AgentCount: 1,
			PodCount:   2,
			Cluster:    "edge-ml",
		},
	}
}

func (h *AgentSwarmHandlers) getDemoFederation() FederationStatus {
	return FederationStatus{
		Connected:   true,
		EdgeCount:   2,
		RegionCount: 1,
		CloudCount:  1,
		SyncStatus: map[string]string{
			"edge-ran-1": "synced",
			"edge-ran-2": "synced",
			"edge-ml":    "synced",
			"region-1":   "synced",
			"cloud-1":    "synced",
		},
		LastSync: time.Now().Add(-30 * time.Second),
	}
}
