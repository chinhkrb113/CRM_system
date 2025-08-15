import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, UserCircle2, UserCog } from 'lucide-react'

interface Team {
  id: string
  name: string
  mentor: string
  leader: string
  members: number
  status: 'active' | 'inactive'
}

const mockTeams: Team[] = [
  { id: 't1', name: 'Frontend Squad', mentor: 'Alice Nguyen', leader: 'Minh Tran', members: 8, status: 'active' },
  { id: 't2', name: 'Backend Guild', mentor: 'Bob Pham', leader: 'Huy Le', members: 6, status: 'active' },
  { id: 't3', name: 'Data Ninjas', mentor: 'Alice Nguyen', leader: 'Thu Ha', members: 5, status: 'inactive' },
  { id: 't4', name: 'Mobile Force', mentor: 'Linh Vu', leader: 'Quang Do', members: 7, status: 'active' },
]

export function Teams() {
  const [mentor, setMentor] = useState<string>('all')
  const [leader, setLeader] = useState<string>('all')
  const [query, setQuery] = useState('')

  const mentors = useMemo(() => Array.from(new Set(mockTeams.map(t => t.mentor))), [])
  const leaders = useMemo(() => Array.from(new Set(mockTeams.map(t => t.leader))), [])

  const filtered = useMemo(() => {
    return mockTeams.filter((t) => {
      const m = mentor === 'all' || t.mentor === mentor
      const l = leader === 'all' || t.leader === leader
      const q = !query || t.name.toLowerCase().includes(query.toLowerCase())
      return m && l && q
    })
  }, [mentor, leader, query])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">Danh sách team, lọc theo mentor/leader.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><UserCircle2 className="h-4 w-4"/>Mentor</div>
              <Select value={mentor} onValueChange={setMentor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mentor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All mentors</SelectItem>
                  {mentors.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><UserCog className="h-4 w-4"/>Leader</div>
              <Select value={leader} onValueChange={setLeader}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All leaders</SelectItem>
                  {leaders.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Search</div>
              <Input placeholder="Search teams..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <Card key={t.id} className="p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-muted-foreground">Mentor: {t.mentor}</div>
                    <div className="text-sm text-muted-foreground">Leader: {t.leader}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{t.members}</div>
                    <div className="text-xs text-muted-foreground">members</div>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge variant={t.status === 'active' ? 'success' : 'secondary'}>
                    {t.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">No teams found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}