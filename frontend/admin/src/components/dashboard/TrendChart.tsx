'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

interface TrendChartProps {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  emptyMessage?: string;
}

export function TrendChart({ title, data, xKey, yKey, emptyMessage }: TrendChartProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      {data.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No trend data yet"
            description={emptyMessage ?? 'This backend endpoint has not been implemented yet.'}
          />
        </div>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey={yKey} stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
