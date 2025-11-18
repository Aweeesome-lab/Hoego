import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyTrend } from '@/types/tauri-commands';

interface DailyTrendChartProps {
  data: DailyTrend[];
  isDarkMode: boolean;
}

// Pastel color palette matching CategoryPieChart
const COLORS = [
  '#a78bfa', // soft purple
  '#60a5fa', // soft blue
  '#34d399', // soft green
  '#fbbf24', // soft yellow
  '#fb923c', // soft orange
  '#f472b6', // soft pink
  '#2dd4bf', // soft teal
  '#c084fc', // soft violet
];

export function DailyTrendChart({ data, isDarkMode }: DailyTrendChartProps) {
  // Get all unique categories across all days
  const allCategories = React.useMemo(() => {
    const categoriesSet = new Set<string>();
    data.forEach((day) => {
      Object.keys(day.categories).forEach((cat) => categoriesSet.add(cat));
    });
    return Array.from(categoriesSet);
  }, [data]);

  // Transform data for stacked bar chart
  const chartData = React.useMemo(() => {
    return data.map((day) => {
      const dayData: any = {
        date: day.date.substring(5), // Remove year, show MM-DD
      };

      allCategories.forEach((category) => {
        const seconds = day.categories[category] || 0;
        dayData[category] = (seconds / 3600).toFixed(2); // Convert to hours
      });

      return dayData;
    });
  }, [data, allCategories]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce(
        (sum: number, entry: any) => sum + parseFloat(entry.value || 0),
        0
      );

      return (
        <div
          className={`px-3 py-2 rounded-lg border shadow-lg ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <p className="font-semibold text-[13px] mb-2">{label}</p>
          {payload
            .filter((entry: any) => parseFloat(entry.value) > 0)
            .map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-[11px]">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-400">{entry.name}:</span>
                <span className="font-mono">{entry.value}h</span>
              </div>
            ))}
          <div
            className={`mt-2 pt-2 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            }`}
          >
            <span className="text-[11px] text-slate-400">총: </span>
            <span className="text-[11px] font-mono font-semibold">
              {total.toFixed(2)}h
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0 || allCategories.length === 0) {
    return (
      <div
        className={`rounded-xl border p-8 text-center ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <p
          className={`text-[13px] ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          일별 데이터가 없습니다
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      <h3
        className={`text-[13px] font-semibold mb-4 ${
          isDarkMode ? 'text-slate-200' : 'text-slate-900'
        }`}
      >
        일별 시간 추이
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkMode ? '#334155' : '#e2e8f0'}
          />
          <XAxis
            dataKey="date"
            stroke={isDarkMode ? '#94a3b8' : '#64748b'}
            style={{ fontSize: '11px' }}
          />
          <YAxis
            stroke={isDarkMode ? '#94a3b8' : '#64748b'}
            style={{ fontSize: '11px' }}
            label={{
              value: '시간 (h)',
              angle: -90,
              position: 'insideLeft',
              style: {
                fontSize: '11px',
                fill: isDarkMode ? '#94a3b8' : '#64748b',
              },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
            formatter={(value) => (
              <span
                className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}
              >
                {value}
              </span>
            )}
          />
          {allCategories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
