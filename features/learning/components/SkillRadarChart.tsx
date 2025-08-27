import React from 'react';
import { SkillMap } from '../../../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

interface SkillRadarChartProps {
    data: SkillMap;
    studentName: string;
}

function SkillRadarChart({ data, studentName }: SkillRadarChartProps): React.ReactNode {
    const chartData = data.length > 2 ? data : [...data, { skill: '...', score: 0 }]; // Radar chart needs at least 3 points

    return (
        <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="skill" stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <Radar name={studentName} dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))'
                        }}
                    />
                    <Legend />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SkillRadarChart;