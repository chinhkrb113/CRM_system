import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const skills = [
  { skill: 'Frontend', score: 78 },
  { skill: 'Backend', score: 65 },
  { skill: 'DevOps', score: 50 },
  { skill: 'Data', score: 55 },
  { skill: 'Communication', score: 82 },
  { skill: 'Problem Solving', score: 75 },
]

const history = [
  { task: 'Task A', status: 'Completed', score: 85, late: false },
  { task: 'Task B', status: 'In Progress', score: 70, late: false },
  { task: 'Task C', status: 'Pending', score: 0, late: false },
  { task: 'Task D', status: 'Completed', score: 90, late: false },
  { task: 'Task E', status: 'Completed', score: 60, late: true },
]

export function StudentProfile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
        <p className="text-muted-foreground">Radar kỹ năng, lịch sử task, nhận xét tiêu biểu.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skill Radar</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={skills}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <Tooltip />
                <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">{h.task}</div>
                    <div className="text-xs text-muted-foreground">{h.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Score: {h.score}</div>
                    {h.late && <div className="text-xs text-red-500">Late</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nhận xét tiêu biểu</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Tư duy logic tốt, hoàn thành bài đúng hạn.</li>
            <li>Chủ động trao đổi khi gặp vấn đề.</li>
            <li>Cần cải thiện kỹ năng backend và testing.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}