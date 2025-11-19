import { invoke } from '@tauri-apps/api/tauri';
import {
  Calendar,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React from 'react';

import { CategoryPieChart } from './charts/CategoryPieChart';
import { DailyTrendChart } from './charts/DailyTrendChart';
import { ProductivityChart } from './charts/ProductivityChart';

import type { GetWeekDataPayload, WeekData } from '@/types/tauri-commands';

import { useAppStore } from '@/store/appStore';

interface WeeklyDashboardProps {
  isDarkMode: boolean;
}

export function WeeklyDashboard({ isDarkMode }: WeeklyDashboardProps) {
  const [showDebugInfo, setShowDebugInfo] = React.useState(false);

  const {
    weekStartDay,
    currentWeekStart,
    weekData,
    isLoadingWeekData,
    weekDataError,
    setWeekStartDay,
    setCurrentWeekStart,
    setWeekData,
    setIsLoadingWeekData,
    setWeekDataError,
  } = useAppStore();

  // Load week data on mount and when week changes
  React.useEffect(() => {
    void loadWeekData();
  }, [currentWeekStart, weekStartDay]);

  const loadWeekData = async () => {
    try {
      setIsLoadingWeekData(true);
      setWeekDataError(null);

      const payload: GetWeekDataPayload = {
        startDate: currentWeekStart,
        weekStartDay,
      };

      const data = await invoke<WeekData>('get_week_data', { payload });
      setWeekData(data);
    } catch (error) {
      console.error('Failed to load week data:', error);
      setWeekDataError(
        error instanceof Error ? error.message : '주간 데이터 로딩 실패'
      );
    } finally {
      setIsLoadingWeekData(false);
    }
  };

  // Get current week start date
  const getCurrentWeekStart = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const startDayOffset = weekStartDay === 'sunday' ? 0 : 1;

    let diff = dayOfWeek - startDayOffset;
    if (diff < 0) diff += 7;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - diff);

    const isoParts = weekStart.toISOString().split('T');
    return isoParts[0] as string;
  };

  // Navigate to previous/next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = new Date(currentWeekStart);
    const offset = direction === 'prev' ? -7 : 7;
    current.setDate(current.getDate() + offset);
    const isoParts = current.toISOString().split('T');
    setCurrentWeekStart(isoParts[0] as string);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getCurrentWeekStart());
  };

  // Format date range
  const getDateRange = () => {
    if (!weekData || !weekData.startDate || !weekData.endDate)
      return '날짜 선택';
    return `${weekData.startDate} ~ ${weekData.endDate}`;
  };

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div
        className={`rounded-xl border p-4 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar
              className={`h-4 w-4 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <h3
              className={`text-[13px] font-semibold ${
                isDarkMode ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              주간 선택
            </h3>
          </div>

          {/* Week Start Day Toggle */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-black/5 dark:bg-white/5">
            <button
              onClick={() => setWeekStartDay('sunday')}
              className={`px-3 py-1 text-[11px] rounded-md transition ${
                weekStartDay === 'sunday'
                  ? isDarkMode
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              일요일 시작
            </button>
            <button
              onClick={() => setWeekStartDay('monday')}
              className={`px-3 py-1 text-[11px] rounded-md transition ${
                weekStartDay === 'monday'
                  ? isDarkMode
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              월요일 시작
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className={`px-3 py-1.5 text-[12px] rounded-md transition ${
              isDarkMode
                ? 'bg-white/10 text-slate-300 hover:bg-white/15'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            이전 주
          </button>

          <div
            className={`flex-1 text-center text-[12px] font-mono ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {getDateRange()}
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className={`px-3 py-1.5 text-[12px] rounded-md transition ${
              isDarkMode
                ? 'bg-white/10 text-slate-300 hover:bg-white/15'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            다음 주
          </button>

          <button
            onClick={goToCurrentWeek}
            className={`px-3 py-1.5 text-[12px] rounded-md transition ${
              isDarkMode
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            이번 주
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingWeekData && (
        <div
          className={`rounded-xl border p-8 text-center ${
            isDarkMode
              ? 'bg-white/5 border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p
            className={`text-[13px] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            주간 데이터를 불러오는 중...
          </p>
        </div>
      )}

      {/* Error State */}
      {weekDataError && (
        <div
          className={`rounded-xl border p-6 ${
            isDarkMode
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle
              className={`h-4 w-4 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}
            />
            <h3
              className={`text-[13px] font-semibold ${
                isDarkMode ? 'text-red-400' : 'text-red-800'
              }`}
            >
              데이터 로딩 실패
            </h3>
          </div>
          <p
            className={`text-[12px] ${
              isDarkMode ? 'text-red-300' : 'text-red-700'
            }`}
          >
            {weekDataError}
          </p>
          <button
            onClick={() => void loadWeekData()}
            className={`mt-3 px-3 py-1.5 text-[12px] rounded-md transition ${
              isDarkMode
                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Week Data Display */}
      {!isLoadingWeekData && !weekDataError && weekData && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div
            className={`rounded-xl border p-4 ${
              isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp
                className={`h-4 w-4 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <h3
                className={`text-[13px] font-semibold ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                주간 통계
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-white/5' : 'bg-slate-50'
                }`}
              >
                <div
                  className={`text-[11px] mb-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  기록된 일수
                </div>
                <div
                  className={`text-[18px] font-semibold ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  {
                    weekData.dailyEntries.filter((d) => d.dumpContent.trim())
                      .length
                  }{' '}
                  / 7
                </div>
              </div>

              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-white/5' : 'bg-slate-50'
                }`}
              >
                <div
                  className={`text-[11px] mb-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  AI 피드백
                </div>
                <div
                  className={`text-[18px] font-semibold ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  {weekData.dailyEntries.filter((d) => d.aiFeedback).length}개
                </div>
              </div>

              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-white/5' : 'bg-slate-50'
                }`}
              >
                <div
                  className={`text-[11px] mb-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  회고 작성
                </div>
                <div
                  className={`text-[18px] font-semibold ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  {
                    weekData.dailyEntries.filter((d) => d.retrospectContent)
                      .length
                  }
                  개
                </div>
              </div>
            </div>
          </div>

          {/* Debug Info Section */}
          <div
            className={`rounded-xl border ${
              isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-slate-200'
            }`}
          >
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className={`w-full flex items-center justify-between p-4 text-left ${
                isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
              } rounded-xl transition`}
            >
              <span
                className={`text-[13px] font-semibold ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                데이터 상세 정보 (디버깅)
              </span>
              {showDebugInfo ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showDebugInfo && (
              <div className="p-4 pt-0 space-y-4">
                {/* Raw Category Data */}
                <div>
                  <h4
                    className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    카테고리별 시간 (초)
                  </h4>
                  <div
                    className={`p-3 rounded-lg font-mono text-[11px] overflow-x-auto ${
                      isDarkMode ? 'bg-black/20' : 'bg-slate-100'
                    }`}
                  >
                    <pre
                      className={
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }
                    >
                      {JSON.stringify(
                        weekData.aggregatedStats.totalCategories,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>

                {/* Daily Entries Sample */}
                <div>
                  <h4
                    className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    일별 데이터 샘플 (첫 3일)
                  </h4>
                  {weekData.dailyEntries.slice(0, 3).map((day, idx) => (
                    <div
                      key={idx}
                      className={`mb-3 p-3 rounded-lg ${
                        isDarkMode ? 'bg-black/20' : 'bg-slate-100'
                      }`}
                    >
                      <div
                        className={`text-[11px] font-semibold mb-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {day.date}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        카테고리:{' '}
                        {Object.keys(day.categorizedTime).length > 0
                          ? Object.keys(day.categorizedTime).join(', ')
                          : '없음'}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Dump 길이: {day.dumpContent.length} 문자
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            {/* Time Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryPieChart
                data={weekData.aggregatedStats.totalCategories}
                isDarkMode={isDarkMode}
              />
              <ProductivityChart
                data={weekData.aggregatedStats.productivityVsWaste}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Daily Trend Chart */}
            <DailyTrendChart
              data={weekData.aggregatedStats.dailyTrend}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
}
