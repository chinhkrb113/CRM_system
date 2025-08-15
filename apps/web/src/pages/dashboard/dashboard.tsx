import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, ClipboardList, TrendingUp } from 'lucide-react'

const stats = [
  {
    title: 'Total Leads',
    value: '2,345',
    description: '+20.1% from last month',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    title: 'Appointments',
    value: '156',
    description: '+12.5% from last month',
    icon: Calendar,
    color: 'text-green-600',
  },
  {
    title: 'Active Tasks',
    value: '89',
    description: '+5.2% from last month',
    icon: ClipboardList,
    color: 'text-orange-600',
  },
  {
    title: 'Conversion Rate',
    value: '24.5%',
    description: '+2.1% from last month',
    icon: TrendingUp,
    color: 'text-purple-600',
  },
]

export function Dashboard() {
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your team and leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'New lead assigned',
                  user: 'John Doe',
                  time: '2 minutes ago',
                },
                {
                  action: 'Appointment scheduled',
                  user: 'Jane Smith',
                  time: '15 minutes ago',
                },
                {
                  action: 'Task completed',
                  user: 'Mike Johnson',
                  time: '1 hour ago',
                },
                {
                  action: 'Lead converted',
                  user: 'Sarah Wilson',
                  time: '2 hours ago',
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
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