import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface TeamStatusChartProps {
    data: any[];
}

const COLORS = {
    'Planning': '#F59E0B',      // amber-500
    'In Progress': '#3B82F6', // blue-500
    'Completed': '#22C55E',   // green-500
};

function TeamStatusChart({ data }: TeamStatusChartProps) {
    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))'
                        }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default TeamStatusChart;