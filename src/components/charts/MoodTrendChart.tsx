import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export interface MoodTrendPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  mood: number; // 1-10
}

interface MoodTrendChartProps {
  data: MoodTrendPoint[];
  className?: string;
}

/**
 * MoodTrendChart
 * Shows mood data (1-10) over time using a simple Recharts LineChart.
 * Expects data to be sorted ascending by date before passing in.
 */
const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ data, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center text-neutral-500 ${className}`}>
        No mood data to display yet.
      </div>
    );
  }

  // Prepare tick formatter to show friendly dates (e.g., 12/06)
  const tickFormatter = (value: string) => {
    try {
      return format(new Date(value), 'dd/MM');
    } catch {
      return value;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tickFormatter={tickFormatter} stroke="#6b7280" />
        <YAxis domain={[1, 10]} stroke="#6b7280" tickCount={6} />
        <Tooltip
          formatter={(value) => [`${value}/10`, 'Mood']}
          labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
        />
        <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MoodTrendChart; 