import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, Calendar, ClipboardList, TrendingUp, Target, Phone, Mail, Building } from 'lucide-react'
import { useEffect, useState } from 'react'
import { leadsService, type Lead } from '@/services/leads'
import { useAuthStore } from '@/stores/auth'

interface DashboardStats {
  totalLeads: number
  qualifiedLeads: number
  conversionRate: number
  recentLeads: number
  leadsByStatus: Record<string, number>
  leadsBySource: Record<string, number>
  averageScore: number
}

export function Dashboard() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    qualifiedLeads: 0,
    conversionRate: 0,
    recentLeads: 0,
    leadsByStatus: {},
    leadsBySource: {},
    averageScore: 0,
  })
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        console.log('🔍 No token available for dashboard stats')
        setLoading(false)
        return
      }

      try {
        console.log('📊 Fetching dashboard stats...', { token: token ? 'exists' : 'missing' })
        const [leadStats, leadsResponse] = await Promise.all([
          leadsService.getLeadStats(undefined, undefined, token),
          leadsService.getLeads({}, { page: 1, limit: 5 }, token)
        ])
        
        console.log('📊 Raw API response:', { leadStats, leadsResponse })
        
        const qualifiedLeads = leadStats.byStatus?.QUALIFIED || 0
        const convertedLeads = (leadStats.byStatus?.CONVERTED || 0) + (leadStats.byStatus?.CLOSED_WON || 0)
        const conversionRate = leadStats.total && leadStats.total > 0 
          ? Math.round((convertedLeads / leadStats.total) * 100) 
          : 0

        setStats({
          totalLeads: leadStats.total || 0,
          qualifiedLeads,
          conversionRate,
          recentLeads: leadStats.recentlyCreated || 0,
          leadsByStatus: leadStats.byStatus || {},
          leadsBySource: leadStats.bySource || {},
          averageScore: leadStats.averageScore || 0,
        })
        
        setRecentLeads(leadsResponse.leads || [])
        
        console.log('✅ Dashboard stats loaded:', {
          totalLeads: leadStats.total || 0,
          qualifiedLeads,
          conversionRate,
          recentLeads: leadStats.recentlyCreated || 0,
        })
      } catch (err) {
        console.error('❌ Failed to fetch dashboard stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  const dashboardCards = [
    {
      title: 'Total Leads',
      value: loading ? '...' : stats.totalLeads.toLocaleString(),
      description: 'All leads in system',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Qualified Leads',
      value: loading ? '...' : stats.qualifiedLeads.toLocaleString(),
      description: 'Ready for conversion',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Conversion Rate',
      value: loading ? '...' : `${stats.conversionRate}%`,
      description: 'Leads to customers',
      icon: Calendar,
      color: 'text-purple-600',
    },
    {
      title: 'Recent Leads',
      value: loading ? '...' : stats.recentLeads.toLocaleString(),
      description: 'New this period',
      icon: ClipboardList,
      color: 'text-orange-600',
    },
    {
      title: 'Average Score',
      value: loading ? '...' : `${stats.averageScore.toFixed(1)}/10`,
      description: 'Lead quality score',
      icon: Target,
      color: 'text-indigo-600',
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your business metrics.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to load dashboard data: {error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please check your connection and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your business metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {dashboardCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Leads Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads by Status</CardTitle>
            <CardDescription>
              Distribution of leads across different stages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.leadsByStatus).map(([status, count]) => {
                const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                const statusLabels: Record<string, string> = {
                  NEW: 'New',
                  CONTACTED: 'Contacted',
                  QUALIFIED: 'Qualified',
                  PROPOSAL_SENT: 'Proposal Sent',
                  NEGOTIATION: 'Negotiation',
                  CLOSED_WON: 'Closed Won',
                  CLOSED_LOST: 'Closed Lost',
                  CONVERTED: 'Converted',
                  LOST: 'Lost'
                }
                const statusColors: Record<string, string> = {
                  NEW: 'bg-blue-500',
                  CONTACTED: 'bg-yellow-500',
                  QUALIFIED: 'bg-green-500',
                  PROPOSAL_SENT: 'bg-purple-500',
                  NEGOTIATION: 'bg-orange-500',
                  CLOSED_WON: 'bg-emerald-500',
                  CLOSED_LOST: 'bg-red-500',
                  CONVERTED: 'bg-emerald-600',
                  LOST: 'bg-red-600'
                }
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`} />
                      <span className="text-sm font-medium">{statusLabels[status] || status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads by Source</CardTitle>
            <CardDescription>
              Where your leads are coming from.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.leadsBySource).map(([source, count]) => {
                const percentage = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                const sourceLabels: Record<string, string> = {
                  WEBSITE: 'Website',
                  SOCIAL_MEDIA: 'Social Media',
                  EMAIL_CAMPAIGN: 'Email Campaign',
                  COLD_CALL: 'Cold Call',
                  REFERRAL: 'Referral',
                  EVENT: 'Event',
                  ADVERTISEMENT: 'Advertisement',
                  OTHER: 'Other'
                }
                return (
                  <div key={source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{sourceLabels[source] || source}</span>
                      <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>
              Latest leads added to the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentLeads.length > 0 ? (
                recentLeads.map((lead) => {
                  const getStatusVariant = (status: string) => {
                    switch (status) {
                      case 'NEW': return 'bg-blue-100 text-blue-800'
                      case 'CONTACTED': return 'bg-yellow-100 text-yellow-800'
                      case 'QUALIFIED': return 'bg-green-100 text-green-800'
                      case 'CLOSED_WON': return 'bg-emerald-100 text-emerald-800'
                      case 'CLOSED_LOST': return 'bg-red-100 text-red-800'
                      default: return 'bg-gray-100 text-gray-800'
                    }
                  }
                  
                  return (
                    <div key={lead.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
                          <Badge className={`text-xs ${getStatusVariant(lead.status)}`}>
                            {lead.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {lead.company && (
                            <div className="flex items-center space-x-1">
                              <Building className="h-3 w-3" />
                              <span>{lead.company}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent leads found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              'Add New Lead',
              'Schedule Appointment',
              'Create Task',
              'Generate Report',
            ].map((action) => (
              <button
                key={action}
                className="w-full rounded-lg border border-dashed border-gray-300 p-3 text-left text-sm hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
              >
                {action}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}