import { useMemo, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClipboardList, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'late'

interface RubricItem {
  key: string
  label: string
  weight: number // 0..1
}

interface SubmissionItem {
  id: string
  student: string
  task: string
  deadline: string // ISO
  submittedAt?: string // ISO
  status: SubmissionStatus
  score?: number // 0..100
}

const RUBRIC: RubricItem[] = [
  { key: 'quality', label: 'Code Quality', weight: 0.4 },
  { key: 'completeness', label: 'Completeness', weight: 0.4 },
  { key: 'timeliness', label: 'Timeliness', weight: 0.2 },
]

const MOCK_SUBMISSIONS: SubmissionItem[] = [
  {
    id: 's1',
    student: 'Alice Nguyen',
    task: 'React Todo App',
    deadline: '2025-08-12T23:59:59Z',
    submittedAt: '2025-08-12T20:00:00Z',
    status: 'submitted',
  },
  {
    id: 's2',
    student: 'Bob Tran',
    task: 'Node API Server',
    deadline: '2025-08-10T23:59:59Z',
    submittedAt: '2025-08-11T01:00:00Z',
    status: 'late',
  },
  {
    id: 's3',
    student: 'Charlie Pham',
    task: 'SQL Schema Design',
    deadline: '2025-08-15T23:59:59Z',
    status: 'pending',
  },
]

export function TrainingTasks() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all')
  const [items, setItems] = useState<SubmissionItem[]>(MOCK_SUBMISSIONS)

  // Grade modal state
  const [gradingId, setGradingId] = useState<string | null>(null)
  const [rubricValues, setRubricValues] = useState<Record<string, number>>({
    quality: 8,
    completeness: 8,
    timeliness: 10,
  })

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'student' | 'task' | 'deadline' | 'submittedAt' | 'status' | 'score'>('deadline')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    // Reset to first page when filters/search change
    setPage(1)
  }, [search, statusFilter, sortBy, sortDir, pageSize])

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchSearch = `${it.student} ${it.task}`.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' ? true : it.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [items, search, statusFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const getVal = (it: SubmissionItem) => {
        switch (sortBy) {
          case 'student': return it.student.toLowerCase()
          case 'task': return it.task.toLowerCase()
          case 'deadline': return new Date(it.deadline).getTime()
          case 'submittedAt': return it.submittedAt ? new Date(it.submittedAt).getTime() : 0
          case 'status': return it.status
          case 'score': return typeof it.score === 'number' ? it.score : -1
          default: return ''
        }
      }
      const va = getVal(a) as any
      const vb = getVal(b) as any
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
    return arr
  }, [filtered, sortBy, sortDir])

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = sorted.slice(start, end)
  const total = sorted.length
  const from = total ? start + 1 : 0
  const to = Math.min(total, end)

  const requestSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const calcWeightedScore = (vals: Record<string, number>) => {
    let total = 0
    RUBRIC.forEach((r) => {
      const v = Math.max(0, Math.min(10, Number(vals[r.key] ?? 0)))
      total += v * 10 * r.weight // convert to 0..100
    })
    return Math.round(total)
  }

  const openGrade = (id: string) => {
    setGradingId(id)
  }

  const closeGrade = () => setGradingId(null)

  const saveGrade = () => {
    if (!gradingId) return
    const newScore = calcWeightedScore(rubricValues)
    setItems((prev) =>
      prev.map((it) => (it.id === gradingId ? { ...it, score: newScore, status: 'graded' } : it))
    )
    setGradingId(null)
  }

  const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
    const map: Record<SubmissionStatus, { label: string; cls: string }> = {
      pending: { label: 'Pending', cls: 'bg-gray-200 text-gray-700' },
      submitted: { label: 'Submitted', cls: 'bg-blue-100 text-blue-700' },
      graded: { label: 'Graded', cls: 'bg-green-100 text-green-700' },
      late: { label: 'Late', cls: 'bg-red-100 text-red-700' },
    }
    const { label, cls } = map[status]
    return <Badge variant="outline" className={cls}>{label}</Badge>
  }

  const isLate = (it: SubmissionItem) => {
    if (!it.submittedAt) return false
    return new Date(it.submittedAt).getTime() > new Date(it.deadline).getTime()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Training Tasks (Submissions)</h1>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative md:w-80">
            <Input
              placeholder="Search by student or task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'submitted' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('submitted')}
              size="sm"
            >
              Submitted
            </Button>
            <Button
              variant={statusFilter === 'late' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('late')}
              size="sm"
            >
              Late
            </Button>
            <Button
              variant={statusFilter === 'graded' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('graded')}
              size="sm"
            >
              Graded
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('student')} className="cursor-pointer select-none">
                Student {sortBy === 'student' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </TableHead>
              <TableHead onClick={() => requestSort('task')} className="cursor-pointer select-none">
                Task {sortBy === 'task' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </TableHead>
              <TableHead onClick={() => requestSort('deadline')} className="cursor-pointer select-none">
                Deadline {sortBy === 'deadline' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </TableHead>
              <TableHead onClick={() => requestSort('submittedAt')} className="cursor-pointer select-none">
                Submitted {sortBy === 'submittedAt' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </TableHead>
              <TableHead onClick={() => requestSort('status')} className="cursor-pointer select-none">
                Status {sortBy === 'status' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </TableHead>
              <TableHead onClick={() => requestSort('score')} className="cursor-pointer select-none">
                Score {sortBy === 'score' && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.student}</TableCell>
                <TableCell>{it.task}</TableCell>
                <TableCell>{new Date(it.deadline).toLocaleString()}</TableCell>
                <TableCell>
                  {it.submittedAt ? (
                    <div className="flex items-center gap-2">
                      <span>{new Date(it.submittedAt).toLocaleString()}</span>
                      {isLate(it) && <Badge className="bg-red-100 text-red-700">Late</Badge>}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={it.status} />
                </TableCell>
                <TableCell>{typeof it.score === 'number' ? `${it.score}` : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openGrade(it.id)} disabled={it.status === 'pending'}>
                    Grade
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Rows per page:
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v))}>
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-muted-foreground">{from}–{to} of {total}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => (end < total ? p + 1 : p))} disabled={end >= total}>Next</Button>
          </div>
        </div>
      </div>

      {/* Grading Modal */}
      {gradingId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeGrade} />
          <div
            role="dialog"
            aria-modal="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[95vw] rounded-lg border bg-background shadow-lg"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">Grade Submission</div>
              <Button size="icon" variant="ghost" onClick={closeGrade}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-muted-foreground">Set rubric scores (0-10). Weighted total is calculated automatically.</div>
              <div className="space-y-3">
                {RUBRIC.map((r) => (
                  <div key={r.key} className="flex items-center gap-3">
                    <div className="w-40 text-sm">{r.label} <span className="text-muted-foreground">({Math.round(r.weight * 100)}%)</span></div>
                    <Input
                      type="number"
                      value={rubricValues[r.key] ?? 0}
                      onChange={(e) =>
                        setRubricValues((prev) => ({ ...prev, [r.key]: Number(e.target.value) }))
                      }
                      min={0}
                      max={10}
                      step={1}
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                Total (auto): <span className="font-semibold">{calcWeightedScore(rubricValues)}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
              <Button variant="outline" onClick={closeGrade}>Cancel</Button>
              <Button onClick={saveGrade}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}