
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { KpiData } from '../types';
import { cn } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

function KpiCard({ title, value, change, changeType, icon }: KpiData): React.ReactNode {
  const isIncrease = changeType === 'increase';
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className={cn('text-xs text-muted-foreground flex items-center', isIncrease ? 'text-green-500' : 'text-red-500')}>
          {isIncrease ? <ArrowUpRight className="h-4 w-4 mr-1"/> : <ArrowDownRight className="h-4 w-4 mr-1"/>}
          {change} vs last month
        </p>
      </CardContent>
    </Card>
  );
}

export default KpiCard;