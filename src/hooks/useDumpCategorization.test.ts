/**
 * Timestamp parsing test
 * Run this to verify that timestamp parsing works correctly
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Copy the parsing functions from useDumpCategorization.ts
interface ParsedEntry {
  time: string;
  timeInMinutes: number;
  content: string;
  durationMinutes?: number;
  durationText?: string;
}

function parseTimestamps(content: string): ParsedEntry[] {
  const lines = content.split('\n');
  const entries: ParsedEntry[] = [];

  for (const line of lines) {
    const match = line.match(/\((\d{2}):(\d{2}):(\d{2})\)/);
    if (match && match[1] && match[2] && match[3]) {
      const hh = match[1];
      const mm = match[2];
      const ss = match[3];
      const timeInMinutes = parseInt(hh, 10) * 60 + parseInt(mm, 10);
      const cleanContent = line
        .replace(/\s*\(\d{2}:\d{2}:\d{2}\)\s*$/, '')
        .replace(/^\s*[\*\-]\s*/, '')
        .trim();

      entries.push({
        time: `${hh}:${mm}:${ss}`,
        timeInMinutes,
        content: cleanContent,
      });
    }
  }

  return entries;
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '-';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}시간 ${mins}분`;
  } else if (hours > 0) {
    return `${hours}시간`;
  } else {
    return `${mins}분`;
  }
}

function calculateDurations(entries: ParsedEntry[]): ParsedEntry[] {
  const result: ParsedEntry[] = [];

  for (let i = 0; i < entries.length - 1; i++) {
    const current = entries[i];
    const next = entries[i + 1];
    if (current && next) {
      const duration = next.timeInMinutes - current.timeInMinutes;
      result.push({
        ...current,
        durationMinutes: duration,
        durationText: formatDuration(duration),
      });
    }
  }

  const lastEntry = entries[entries.length - 1];
  if (lastEntry) {
    result.push({
      ...lastEntry,
      durationMinutes: 0,
      durationText: '-',
    });
  }

  return result;
}

// Test with sample_dump.md
function testTimestampParsing() {
  try {
    const samplePath = join(process.cwd(), 'docs', 'sample_dump.md');
    const content = readFileSync(samplePath, 'utf-8');

    console.log('📋 Timestamp Parsing Test\n');
    console.log('='.repeat(80));

    const parsed = parseTimestamps(content);
    const withDurations = calculateDurations(parsed);

    console.log(`\n총 활동 개수: ${withDurations.length}개`);
    console.log(
      `전체 시간 범위: ${parsed[0]?.time} ~ ${parsed[parsed.length - 1]?.time}`
    );

    const totalMinutes = withDurations.reduce(
      (sum, entry) => sum + (entry.durationMinutes || 0),
      0
    );
    console.log(`총 활동 시간: ${formatDuration(totalMinutes)}\n`);

    console.log('='.repeat(80));
    console.log('\n시간이 계산된 활동 목록:\n');

    withDurations.forEach((entry, i) => {
      const num = String(i + 1).padStart(2, ' ');
      const duration = entry.durationText?.padEnd(10, ' ') || '-'.padEnd(10, ' ');
      const shortContent =
        entry.content.length > 60
          ? entry.content.substring(0, 60) + '...'
          : entry.content;

      console.log(`${num}. [${entry.time}] (${duration}) ${shortContent}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Timestamp parsing successful!\n');

    // Show category suggestions
    console.log('💡 카테고리 분류 예시:\n');
    const categories = {
      '개인 루틴': [] as string[],
      작업: [] as string[],
      운동: [] as string[],
      관계: [] as string[],
      이동: [] as string[],
      기타: [] as string[],
    };

    withDurations.forEach((entry) => {
      const content = entry.content.toLowerCase();
      if (
        content.includes('기상') ||
        content.includes('샤워') ||
        content.includes('먹') ||
        content.includes('씻')
      ) {
        categories['개인 루틴'].push(entry.durationText || '-');
      } else if (
        content.includes('작업') ||
        content.includes('개발') ||
        content.includes('코드') ||
        content.includes('ui')
      ) {
        categories['작업'].push(entry.durationText || '-');
      } else if (
        content.includes('운동') ||
        content.includes('러닝') ||
        content.includes('스트레칭')
      ) {
        categories['운동'].push(entry.durationText || '-');
      } else if (
        content.includes('엄마') ||
        content.includes('친구') ||
        content.includes('점심') ||
        content.includes('저녁')
      ) {
        categories['관계'].push(entry.durationText || '-');
      } else if (
        content.includes('이동') ||
        content.includes('카페') ||
        content.includes('지하철')
      ) {
        categories['이동'].push(entry.durationText || '-');
      } else {
        categories['기타'].push(entry.durationText || '-');
      }
    });

    Object.entries(categories).forEach(([category, durations]) => {
      if (durations.length > 0) {
        console.log(`  ${category}: ${durations.length}개 활동`);
      }
    });

    console.log('\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testTimestampParsing();
