import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Briefcase, Plus, X } from 'lucide-react'

interface Candidate {
  id: string
  name: string
  skills: string[]
  score: number // 0..100
  status: 'Suggested' | 'Requested'
}

const MOCK_POOL: Omit<Candidate, 'score' | 'status'>[] = [
  { id: 'c1', name: 'Alice Nguyen', skills: ['React', 'TypeScript', 'Redux', 'Testing'] },
  { id: 'c2', name: 'Bob Tran', skills: ['Node.js', 'Express', 'MongoDB', 'Docker'] },
  { id: 'c3', name: 'Charlie Pham', skills: ['SQL', 'PostgreSQL', 'Prisma', 'API'] },
  { id: 'c4', name: 'Diana Le', skills: ['React', 'Next.js', 'Tailwind', 'UX'] },
  { id: 'c5', name: 'Ethan Vo', skills: ['Go', 'gRPC', 'Kubernetes', 'CI/CD'] },
  { id: 'c6', name: 'Fiona Do', skills: ['Python', 'FastAPI', 'Pandas', 'ML'] },
]

export function Jobs() {
  // JD form
  const [title, setTitle] = useState('Frontend Engineer')
  const [department, setDepartment] = useState('Engineering')
  const [level, setLevel] = useState('Mid')
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript'])
  const [skillInput, setSkillInput] = useState('')
  const [description, setDescription] = useState('Own the frontend for our CRM modules. Build delightful UX with modern React stack.')
  const [remote, setRemote] = useState(true)

  // Suggestions
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [minScore, setMinScore] = useState(60)

  const overlapScore = (need: string[], has: string[]) => {
    const n = need.map((s) => s.toLowerCase())
    const h = has.map((s) => s.toLowerCase())
    const inter = n.filter((x) => h.includes(x)).length
    const base = need.length ? inter / need.length : 0
    const bonus = Math.min(0.2, (has.length - inter) * 0.02) // tiny bonus breadth
    return Math.round((base + bonus) * 100)
  }

  const generateCandidates = () => {
    const list: Candidate[] = MOCK_POOL.map((c) => ({
      ...c,
      score: overlapScore(skills, c.skills),
      status: 'Suggested',
    }))
      .sort((a, b) => b.score - a.score)
    setCandidates(list)
    setSelected({})
  }

  const visibleCandidates = useMemo(
    () => candidates.filter((c) => c.score >= minScore),
    [candidates, minScore]
  )

  const toggleSelect = (id: string, value?: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: value ?? !prev[id] }))
  }

  const allVisibleIds = useMemo(() => visibleCandidates.map((c) => c.id), [visibleCandidates])
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected[id])

  const toggleSelectAll = () => {
    const newState: Record<string, boolean> = { ...selected }
    const target = !allSelected
    allVisibleIds.forEach((id) => (newState[id] = target))
    setSelected(newState)
  }

  const requestInterview = () => {
    const chosen = Object.keys(selected).filter((id) => selected[id])
    if (!chosen.length) return
    setCandidates((prev) => prev.map((c) => (chosen.includes(c.id) ? { ...c, status: 'Requested' } : c)))
    // In real app, call API here
  }

  const removeSkill = (s: string) => setSkills((arr) => arr.filter((x) => x !== s))

  const addSkill = () => {
    const parts = skillInput
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!parts.length) return
    setSkills((prev) => Array.from(new Set([...prev, ...parts])))
    setSkillInput('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Jobs</h1>
        </div>
      </div>

      {/* JD Form */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Frontend Engineer" />
          </div>
          <div>
            <label className="text-sm font-medium">Department</label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Engineering" />
          </div>
          <div>
            <label className="text-sm font-medium">Level</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Intern">Intern</SelectItem>
                <SelectItem value="Junior">Junior</SelectItem>
                <SelectItem value="Mid">Mid</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="remote" type="checkbox" className="h-4 w-4" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
            <label htmlFor="remote" className="text-sm">Remote-friendly</label>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Required Skills</label>
          <div className="flex gap-2 mt-1">
            <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="React, TypeScript, ..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} />
            <Button type="button" onClick={addSkill}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="flex items-center gap-1">
                {s}
                <button className="-mr-1 rounded hover:bg-foreground/10 p-0.5" onClick={() => removeSkill(s)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Job Description</label>
          <textarea
            className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" onClick={generateCandidates}>Generate Candidates (Mock)</Button>
        </div>
      </Card>

      {/* Suggestions */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Candidate Suggestions</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Min score</span>
            <Select value={String(minScore)} onValueChange={(v) => setMinScore(parseInt(v))}>
              <SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="40">40</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="70">70</SelectItem>
                <SelectItem value="80">80</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>{allSelected ? 'Unselect all' : 'Select all'}</Button>
            <Button size="sm" onClick={requestInterview} disabled={!Object.values(selected).some(Boolean)}>Request Interview</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No candidates. Click "Generate Candidates" to get suggestions.</TableCell>
              </TableRow>
            ) : (
              visibleCandidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-center">
                    <input type="checkbox" checked={!!selected[c.id]} onChange={() => toggleSelect(c.id)} />
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.skills.map((s) => (
                        <Badge key={c.id + s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={c.score >= 70 ? 'text-green-600' : c.score >= 60 ? 'text-amber-600' : 'text-red-600'}>
                      {c.score}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'Requested' ? 'info' : 'secondary'}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}