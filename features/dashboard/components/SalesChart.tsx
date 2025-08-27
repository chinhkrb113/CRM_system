import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { getSalesData } from '../../../services/mockApi';
import { useI18n } from '../../../hooks/useI18n';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';


function SalesChart(): React.ReactNode {
    const salesData = getSalesData();
    const { t } = useI18n();

    return (
        <Card className="shadow-lg h-full">
            <CardHeader>
                <CardTitle>{t('salesOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`}/>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--foreground))'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

export default SalesChart;