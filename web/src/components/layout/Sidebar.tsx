import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { Plus, Pencil, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, WifiOff, ChevronDown, LayoutDashboard } from 'lucide-react'
import { cn } from '../../lib/cn'
import { SnoozedCards } from './SnoozedCards'
import { SidebarCustomizer } from './SidebarCustomizer'
import { useSidebarConfig, SidebarItem } from '../../hooks/useSidebarConfig'
import { useClusters } from '../../hooks/useMCP'
import { useDashboardContextOptional } from '../../hooks/useDashboardContext'

// Dashboard options with descriptions
interface DashboardOption {
  id: string
  name: string
  icon: string
  href: string
  description: string
  color: string
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
  {
    id: 'main',
    name: 'Main Dashboard',
    icon: 'LayoutDashboard',
    href: '/',
    description: 'Customizable overview with cluster health, workloads, and events',
    color: 'text-purple-400',
  },
  {
    id: 'clusters',
    name: 'Clusters',
    icon: 'Server',
    href: '/clusters',
    description: 'Detailed cluster management, health monitoring, and node status',
    color: 'text-cyan-400',
  },
  {
    id: 'workloads',
    name: 'Workloads',
    icon: 'Box',
    href: '/workloads',
    description: 'Deployments, pods, services, and application status across clusters',
    color: 'text-blue-400',
  },
  {
    id: 'compute',
    name: 'Compute',
    icon: 'Cpu',
    href: '/compute',
    description: 'CPU, memory, and GPU resource utilization and capacity',
    color: 'text-orange-400',
  },
  {
    id: 'events',
    name: 'Events',
    icon: 'Activity',
    href: '/events',
    description: 'Real-time cluster events, warnings, and audit logs',
    color: 'text-green-400',
  },
  {
    id: 'security',
    name: 'Security',
    icon: 'Shield',
    href: '/security',
    description: 'Security policies, RBAC, vulnerabilities, and compliance',
    color: 'text-red-400',
  },
  {
    id: 'gitops',
    name: 'GitOps',
    icon: 'GitBranch',
    href: '/gitops',
    description: 'ArgoCD, Flux, Helm releases, and deployment drift detection',
    color: 'text-indigo-400',
  },
]

export function Sidebar() {
  const { config, toggleCollapsed } = useSidebarConfig()
  const { clusters } = useClusters()
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dashboardContext = useDashboardContextOptional()
  const navigate = useNavigate()
  const location = useLocation()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDashboardDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Find current dashboard based on location
  const currentDashboard = DASHBOARD_OPTIONS.find(d =>
    location.pathname === d.href || (d.href !== '/' && location.pathname.startsWith(d.href))
  ) || DASHBOARD_OPTIONS[0]

  // Cluster status counts
  const healthyClusters = clusters.filter((c) => c.healthy === true && c.reachable !== false).length
  const unhealthyClusters = clusters.filter((c) => c.healthy === false && c.reachable !== false).length
  const unreachableClusters = clusters.filter((c) => c.reachable === false).length

  // Handle Add Card click - navigate to dashboard first if not there
  const handleAddCardClick = () => {
    if (location.pathname !== '/') {
      navigate('/')
      // Use setTimeout to allow navigation to complete before opening modal
      setTimeout(() => {
        dashboardContext?.openAddCardModal()
      }, 100)
    } else {
      dashboardContext?.openAddCardModal()
    }
  }

  // Navigate to clusters page with status filter
  const handleClusterStatusClick = (status: 'healthy' | 'unhealthy' | 'unreachable') => {
    navigate(`/clusters?status=${status}`)
  }

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
    return IconComponent ? <IconComponent className={className} /> : null
  }

  const renderNavItem = (item: SidebarItem) => (
    <NavLink
      key={item.id}
      to={item.href}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-purple-500/20 text-purple-400'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
        config.collapsed ? 'justify-center p-3' : 'px-3 py-2'
      )}
      title={config.collapsed ? item.name : undefined}
    >
      {renderIcon(item.icon, config.collapsed ? 'w-6 h-6' : 'w-5 h-5')}
      {!config.collapsed && item.name}
    </NavLink>
  )

  return (
    <>
      <aside data-tour="sidebar" className={cn(
        'fixed left-0 top-16 bottom-0 glass border-r border-border/50 overflow-y-auto transition-all duration-300',
        config.collapsed ? 'w-20 p-3' : 'w-64 p-4'
      )}>
        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-6 p-1 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground z-10"
        >
          {config.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Dashboard Dropdown */}
        {!config.collapsed && (
          <div ref={dropdownRef} className="relative mb-4">
            <button
              onClick={() => setIsDashboardDropdownOpen(!isDashboardDropdownOpen)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all',
                isDashboardDropdownOpen
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-border/50 hover:border-border bg-secondary/30 hover:bg-secondary/50'
              )}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className={cn('w-5 h-5', currentDashboard.color)} />
                <span className="text-sm font-medium text-foreground">{currentDashboard.name}</span>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                isDashboardDropdownOpen && 'rotate-180'
              )} />
            </button>

            {/* Dropdown Menu */}
            {isDashboardDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 py-2 rounded-lg bg-card border border-border shadow-xl z-50 max-h-[60vh] overflow-y-auto">
                {DASHBOARD_OPTIONS.map((option) => {
                  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[option.icon]
                  const isActive = location.pathname === option.href || (option.href !== '/' && location.pathname.startsWith(option.href))
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        navigate(option.href)
                        setIsDashboardDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors',
                        isActive && 'bg-purple-500/10'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {IconComponent && <IconComponent className={cn('w-4 h-4', option.color)} />}
                        <span className={cn(
                          'text-sm font-medium',
                          isActive ? 'text-purple-400' : 'text-foreground'
                        )}>{option.name}</span>
                        {isActive && (
                          <CheckCircle2 className="w-3 h-3 text-purple-400 ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">{option.description}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Primary navigation */}
        <nav className="space-y-1">
          {config.primaryNav.filter(item => !DASHBOARD_OPTIONS.find(d => d.href === item.href)).map(renderNavItem)}
        </nav>

        {/* Divider */}
        <div className="my-6 border-t border-border/50" />

        {/* Secondary navigation */}
        <nav className="space-y-1">
          {config.secondaryNav.map(renderNavItem)}
        </nav>

        {/* Snoozed card swaps */}
        {!config.collapsed && <div data-tour="snoozed"><SnoozedCards /></div>}

        {/* Add card button */}
        {!config.collapsed && (
          <div className="mt-6">
            <button
              onClick={handleAddCardClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Card</span>
            </button>
          </div>
        )}

        {/* Cluster status summary */}
        {config.showClusterStatus && !config.collapsed && (
          <div className="mt-6 p-4 rounded-lg bg-secondary/30">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Cluster Status
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => handleClusterStatusClick('healthy')}
                className="w-full flex items-center justify-between hover:bg-secondary/50 rounded px-1 py-0.5 transition-colors"
              >
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  Healthy
                </span>
                <span className="text-sm font-medium text-green-400">{healthyClusters}</span>
              </button>
              <button
                onClick={() => handleClusterStatusClick('unhealthy')}
                className="w-full flex items-center justify-between hover:bg-secondary/50 rounded px-1 py-0.5 transition-colors"
              >
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  Unhealthy
                </span>
                <span className="text-sm font-medium text-orange-400">{unhealthyClusters}</span>
              </button>
              <button
                onClick={() => handleClusterStatusClick('unreachable')}
                className="w-full flex items-center justify-between hover:bg-secondary/50 rounded px-1 py-0.5 transition-colors"
              >
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
                  Unreachable
                </span>
                <span className="text-sm font-medium text-yellow-400">{unreachableClusters}</span>
              </button>
            </div>
          </div>
        )}

        {/* Customize button */}
        <div className="mt-4">
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className={cn(
              'flex items-center gap-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors',
              config.collapsed ? 'justify-center w-full p-3' : 'px-3 py-2 text-xs'
            )}
            title={config.collapsed ? 'Customize sidebar' : undefined}
          >
            <Pencil className={config.collapsed ? 'w-5 h-5' : 'w-3 h-3'} />
            {!config.collapsed && 'Customize'}
          </button>
        </div>
      </aside>

      {/* Sidebar Customizer Modal */}
      <SidebarCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </>
  )
}
