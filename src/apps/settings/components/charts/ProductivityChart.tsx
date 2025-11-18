import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ProductivityStats } from '@/types/tauri-commands';

interface ProductivityChartProps {
  data: ProductivityStats;
  isDarkMode: boolean;
}

export function ProductivityChart({
  data,
  isDarkMode,
}: ProductivityChartProps) {
  const chartData = React.useMemo(() => {
    return [
      {
        name: '생산적',
        hours: (data.productiveSeconds / 3600).toFixed(1),
        value: data.productiveSeconds,
        percentage: data.productivePercentage.toFixed(1),
        color: '#34d399', // soft green
      },
      {
        name: '비생산적',
        hours: (data.wasteSeconds / 3600).toFixed(1),
        value: data.wasteSeconds,
        percentage: data.wastePercentage.toFixed(1),
        color: '#fb923c', // soft orange (less harsh than red)
      },
    ];
  }, [data]);

  const totalHours = (
    (data.productiveSeconds + data.wasteSeconds) /
    3600
  ).toFixed(1);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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

  const hasData = data.productiveSeconds > 0 || data.wasteSeconds > 0;

  if (!hasData) {
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
          생산성 데이터가 없습니다
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
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-[13px] font-semibold ${
            isDarkMode ? 'text-slate-200' : 'text-slate-900'
          }`}
        >
          생산성 vs 낭비 시간
        </h3>
        <div
          className={`text-[11px] ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          총: <span className="font-mono font-semibold">{totalHours}h</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkMode ? '#334155' : '#e2e8f0'}
          />
          <XAxis
            type="number"
            stroke={isDarkMode ? '#94a3b8' : '#64748b'}
            style={{ fontSize: '11px' }}
            label={{
              value: '시간 (h)',
              position: 'insideBottom',
              offset: -5,
              style: {
                fontSize: '11px',
                fill: isDarkMode ? '#94a3b8' : '#64748b',
              },
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={isDarkMode ? '#94a3b8' : '#64748b'}
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-green-500/10' : 'bg-green-50'
          }`}
        >
          <div
            className={`text-[11px] mb-1 ${
              isDarkMode ? 'text-green-400' : 'text-green-700'
            }`}
          >
            생산적 활동
          </div>
          <div
            className={`text-[16px] font-semibold ${
              isDarkMode ? 'text-green-400' : 'text-green-700'
            }`}
          >
            {chartData[0]?.percentage ?? '0.0'}%
          </div>
        </div>

        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
          }`}
        >
          <div
            className={`text-[11px] mb-1 ${
              isDarkMode ? 'text-red-400' : 'text-red-700'
            }`}
          >
            비생산적 활동
          </div>
          <div
            className={`text-[16px] font-semibold ${
              isDarkMode ? 'text-red-400' : 'text-red-700'
            }`}
          >
            {chartData[1]?.percentage ?? '0.0'}%
          </div>
        </div>
      </div>
    </div>
  );
}
