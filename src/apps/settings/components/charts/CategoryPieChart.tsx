import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface CategoryPieChartProps {
  data: Record<string, number>; // category -> seconds
  isDarkMode: boolean;
}

// Pastel color palette for categories - softer, more pleasant colors
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

export function CategoryPieChart({ data, isDarkMode }: CategoryPieChartProps) {
  // Convert data to chart format and calculate percentages
  const chartData = React.useMemo(() => {
    const totalSeconds = Object.values(data).reduce((sum, val) => sum + val, 0);

    if (totalSeconds === 0) {
      return [];
    }

    return Object.entries(data)
      .map(([category, seconds]) => ({
        name: category,
        value: seconds,
        hours: (seconds / 3600).toFixed(1),
        percentage: ((seconds / totalSeconds) * 100).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Custom label for the pie chart
  const renderLabel = (entry: { percentage: string }) => {
    return `${entry.percentage}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: { name: string; hours: string; percentage: string };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`px-3 py-2 rounded-lg border shadow-lg ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <p className="font-semibold text-[13px] mb-1">{data.name}</p>
          <p className="text-[12px] text-slate-400">
            {data.hours}시간 ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
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
          카테고리별 데이터가 없습니다
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
        카테고리별 시간 비율
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => {
              const data = chartData.find((d) => d.name === value);
              return (
                <span
                  className={`text-[11px] ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {value} ({data?.hours}h)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
