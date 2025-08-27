import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { getLeadsBySourceData } from '../../../services/mockApi';
import { useI18n } from '../../../hooks/useI18n';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#DC2626'];

function LeadsBySourceChart(): React.ReactNode {
    const leadsData = getLeadsBySourceData();
    const { t } = useI18n();
    return (
        <Card className="shadow-lg h-full">
            <CardHeader>
                <CardTitle>{t('leadsBySource')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={leadsData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {leadsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            </CardContent>
        </Card>
    );
}

export default LeadsBySourceChart;