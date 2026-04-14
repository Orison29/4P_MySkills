'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';
import { skillsApi } from '@/api/skills.api';
import { LineChart, LayoutDashboard, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type LearningCategory = 'FAST' | 'MODERATE' | 'SLOW' | 'NO_PROGRESS' | 'REGRESSION';

const CATEGORY_COLORS: Record<LearningCategory, { bg: string; text: string; badge: string }> = {
  FAST:        { bg: '#16a34a', text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  MODERATE:    { bg: '#2563eb', text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
  SLOW:        { bg: '#d97706', text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
  NO_PROGRESS: { bg: '#71717a', text: 'text-zinc-500',   badge: 'bg-zinc-100 text-zinc-500' },
  REGRESSION:  { bg: '#dc2626', text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
};

const CATEGORY_LABELS: Record<LearningCategory, string> = {
  FAST: 'Fast',
  MODERATE: 'Moderate',
  SLOW: 'Slow',
  NO_PROGRESS: 'No Progress',
  REGRESSION: 'Regression',
};

export default function HRAnalyticsPage() {
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [lsStartDate, setLsStartDate] = useState<string>('');
  const [lsEndDate, setLsEndDate] = useState<string>('');

  const { data: employees, isLoading } = useQuery({
    queryKey: ['analytics', 'employees', 'overview'],
    queryFn: analyticsApi.getEmployeesOverview,
  });

  const { data: skills, isLoading: isSkillsLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getSkills,
  });

  useEffect(() => {
    if (!selectedSkillId && skills?.length) {
      setSelectedSkillId(skills[0].id);
    }
  }, [skills, selectedSkillId]);

  const { data: learningSpeed, isLoading: isLsLoading, error: lsError } = useQuery({
    queryKey: ['analytics', 'learning-speed', lsStartDate, lsEndDate],
    queryFn: () => analyticsApi.getLearningSpeed(lsStartDate || undefined, lsEndDate || undefined),
  });

  const { data: skillSpectrum, isLoading: isSkillSpectrumLoading } = useQuery({
    queryKey: ['analytics', 'skill-spectrum', selectedSkillId],
    queryFn: () => analyticsApi.getSkillSpectrumByDepartment(selectedSkillId),
    enabled: !!selectedSkillId,
  });

  const multiSkillRows = useMemo(() => {
    const list = employees ?? [];
    const byDepartment = new Map<string, { department: string; headcount: number; atLeast2Count: number; atMost1Count: number }>();

    list.forEach((emp) => {
      const department = emp.department || 'Unassigned';
      const totalSkills = Number(emp.totalSkills ?? 0);

      if (!byDepartment.has(department)) {
        byDepartment.set(department, {
          department,
          headcount: 0,
          atLeast2Count: 0,
          atMost1Count: 0,
        });
      }

      const row = byDepartment.get(department)!;
      row.headcount += 1;

      if (totalSkills >= 2) {
        row.atLeast2Count += 1;
      } else {
        row.atMost1Count += 1;
      }
    });

    const rows = Array.from(byDepartment.values())
      .map((row) => {
        const atLeast2Pct = row.headcount > 0 ? Math.round((row.atLeast2Count / row.headcount) * 100) : 0;
        const atMost1Pct = row.headcount > 0 ? Math.round((row.atMost1Count / row.headcount) * 100) : 0;
        return {
          ...row,
          atLeast2Pct,
          atMost1Pct,
        };
      })
      .sort((a, b) => a.department.localeCompare(b.department));

    const total = rows.reduce(
      (acc, row) => {
        acc.headcount += row.headcount;
        acc.atLeast2Count += row.atLeast2Count;
        acc.atMost1Count += row.atMost1Count;
        return acc;
      },
      { headcount: 0, atLeast2Count: 0, atMost1Count: 0 }
    );

    const totalRow = {
      department: 'Total',
      headcount: total.headcount,
      atLeast2Count: total.atLeast2Count,
      atMost1Count: total.atMost1Count,
      atLeast2Pct: total.headcount > 0 ? Math.round((total.atLeast2Count / total.headcount) * 100) : 0,
      atMost1Pct: total.headcount > 0 ? Math.round((total.atMost1Count / total.headcount) * 100) : 0,
    };

    return { rows, totalRow };
  }, [employees]);

  const chartRows = useMemo(() => {
    const base = [...multiSkillRows.rows];
    if (multiSkillRows.totalRow.headcount > 0) {
      base.push(multiSkillRows.totalRow);
    }
    return base;
  }, [multiSkillRows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Organization-wide skill insights and tracking.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Dash stat cards */}
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <LayoutDashboard className="w-5 h-5" />
            <h3 className="font-semibold text-zinc-700 ">Total Employees</h3>
          </div>
          <p className="text-3xl font-bold">{isLoading ? '-' : employees?.length || 0}</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-3 text-blue-500 mb-2">
            <LineChart className="w-5 h-5" />
            <h3 className="font-semibold text-zinc-700 ">Skill Progression</h3>
          </div>
          <div className="mt-4">
            <p className="text-sm text-zinc-500 mb-2">Select an employee to view their detailed skill timeline.</p>
            <Link 
              href="/hr/employees"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 :text-blue-300 transition flex items-center gap-1"
            >
              Browse Employees &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Department Wise Multi Skill Dashboard</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Independent of campaigns. Shows how many employees in each department have 2 or more skills.
          </p>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">Loading dashboard...</div>
        ) : chartRows.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">No employee skill data available.</div>
        ) : (
          <>
            <StackedMultiSkillChart rows={chartRows} />

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium border">Department</th>
                    <th className="text-right px-4 py-3 font-medium border">Headcount</th>
                    <th className="text-right px-4 py-3 font-medium border">&gt;=2</th>
                    <th className="text-right px-4 py-3 font-medium border">&lt;=1</th>
                    <th className="text-right px-4 py-3 font-medium border">&gt;=2 %</th>
                    <th className="text-right px-4 py-3 font-medium border">&lt;=1 %</th>
                  </tr>
                </thead>
                <tbody>
                  {multiSkillRows.rows.map((row) => (
                    <tr key={row.department} className="border-t">
                      <td className="px-4 py-3 border font-medium">{row.department}</td>
                      <td className="px-4 py-3 border text-right">{row.headcount}</td>
                      <td className="px-4 py-3 border text-right text-emerald-700">{row.atLeast2Count}</td>
                      <td className="px-4 py-3 border text-right text-red-700">{row.atMost1Count}</td>
                      <td className="px-4 py-3 border text-right text-emerald-700">{row.atLeast2Pct}%</td>
                      <td className="px-4 py-3 border text-right text-red-700">{row.atMost1Pct}%</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-50 font-semibold">
                    <td className="px-4 py-3 border">{multiSkillRows.totalRow.department}</td>
                    <td className="px-4 py-3 border text-right">{multiSkillRows.totalRow.headcount}</td>
                    <td className="px-4 py-3 border text-right text-emerald-700">{multiSkillRows.totalRow.atLeast2Count}</td>
                    <td className="px-4 py-3 border text-right text-red-700">{multiSkillRows.totalRow.atMost1Count}</td>
                    <td className="px-4 py-3 border text-right text-emerald-700">{multiSkillRows.totalRow.atLeast2Pct}%</td>
                    <td className="px-4 py-3 border text-right text-red-700">{multiSkillRows.totalRow.atMost1Pct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Learning Speed ── */}
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-xl font-semibold">Learning Speed</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                How fast employees improve skill ratings over time (velocity = rating delta / days).
              </p>
            </div>
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Start Date</label>
              <input
                type="date"
                className="rounded-md border p-2 text-sm bg-white"
                value={lsStartDate}
                onChange={(e) => setLsStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">End Date</label>
              <input
                type="date"
                className="rounded-md border p-2 text-sm bg-white"
                value={lsEndDate}
                onChange={(e) => setLsEndDate(e.target.value)}
              />
            </div>
            {(lsStartDate || lsEndDate) && (
              <button
                className="text-xs text-zinc-400 hover:text-zinc-600 border rounded px-2 py-2"
                onClick={() => { setLsStartDate(''); setLsEndDate(''); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {isLsLoading ? (
          <div className="h-40 flex items-center justify-center text-zinc-500">Loading learning speed data...</div>
        ) : lsError ? (
          <div className="h-40 flex items-center justify-center text-red-500">Failed to load learning speed data.</div>
        ) : !learningSpeed?.employees?.length ? (
          <div className="h-40 flex items-center justify-center text-zinc-500">No data available for the selected range.</div>
        ) : (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-3">
              {(Object.keys(CATEGORY_LABELS) as LearningCategory[]).map((cat) => (
                <div key={cat} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${CATEGORY_COLORS[cat].badge}`}>
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className="font-bold">{learningSpeed.summary?.[cat] ?? 0}</span>
                </div>
              ))}
            </div>

            {/* Department chart + table */}
            {learningSpeed.departments?.length > 0 && (
              <>
                <LearningSpeedChart rows={learningSpeed.departments} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-zinc-50 text-zinc-600">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium border">Department</th>
                        <th className="text-right px-4 py-3 font-medium border">Employees</th>
                        <th className="text-right px-4 py-3 font-medium border">Avg Velocity</th>
                        <th className="text-right px-4 py-3 font-medium border">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {learningSpeed.departments.map((row: any) => (
                        <tr key={row.department} className="border-t">
                          <td className="px-4 py-3 border font-medium">{row.department}</td>
                          <td className="px-4 py-3 border text-right">{row.employeeCount}</td>
                          <td className={`px-4 py-3 border text-right font-mono ${CATEGORY_COLORS[row.category as LearningCategory]?.text}`}>
                            {row.score.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 border text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[row.category as LearningCategory]?.badge}`}>
                              {CATEGORY_LABELS[row.category as LearningCategory]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Employee table */}
            <div>
              <h3 className="text-base font-semibold mb-3">Employee Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium border">Employee</th>
                      <th className="text-left px-4 py-3 font-medium border">Department</th>
                      <th className="text-right px-4 py-3 font-medium border">Skills Tracked</th>
                      <th className="text-right px-4 py-3 font-medium border">Velocity</th>
                      <th className="text-right px-4 py-3 font-medium border">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {learningSpeed.employees.map((emp: any) => (
                      <tr key={emp.employeeId} className="border-t">
                        <td className="px-4 py-3 border font-medium">{emp.fullname}</td>
                        <td className="px-4 py-3 border text-zinc-600">{emp.department}</td>
                        <td className="px-4 py-3 border text-right">{emp.validSkillCount}</td>
                        <td className={`px-4 py-3 border text-right font-mono ${CATEGORY_COLORS[emp.category as LearningCategory]?.text}`}>
                          {emp.score.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 border text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[emp.category as LearningCategory]?.badge}`}>
                            {CATEGORY_LABELS[emp.category as LearningCategory]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Skill Spectrum by Department</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Select a skill to see how many employees in each department are at Level 0 to Level 5.
            </p>
          </div>

          <div className="min-w-64">
            <label className="text-xs text-zinc-500">Skill</label>
            <select
              className="mt-1 w-full rounded-md border p-2 text-sm bg-white"
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              disabled={isSkillsLoading || !skills?.length}
            >
              {(skills ?? []).map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isSkillSpectrumLoading || isSkillsLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">Loading skill spectrum...</div>
        ) : !skillSpectrum?.departments?.length ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">No skill spectrum data available.</div>
        ) : (
          <>
            <SkillSpectrumChart rows={skillSpectrum.departments} />

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium border">Department</th>
                    <th className="text-right px-4 py-3 font-medium border">Headcount</th>
                    <th className="text-right px-4 py-3 font-medium border">L0</th>
                    <th className="text-right px-4 py-3 font-medium border">L1</th>
                    <th className="text-right px-4 py-3 font-medium border">L2</th>
                    <th className="text-right px-4 py-3 font-medium border">L3</th>
                    <th className="text-right px-4 py-3 font-medium border">L4</th>
                    <th className="text-right px-4 py-3 font-medium border">L5</th>
                  </tr>
                </thead>
                <tbody>
                  {skillSpectrum.departments.map((row: any) => (
                    <tr key={row.departmentId} className="border-t">
                      <td className="px-4 py-3 border font-medium">{row.departmentName}</td>
                      <td className="px-4 py-3 border text-right">{row.headcount}</td>
                      <td className="px-4 py-3 border text-right">{row.levels.level0}</td>
                      <td className="px-4 py-3 border text-right">{row.levels.level1}</td>
                      <td className="px-4 py-3 border text-right">{row.levels.level2}</td>
                      <td className="px-4 py-3 border text-right">{row.levels.level3}</td>
                      <td className="px-4 py-3 border text-right">{row.levels.level4}</td>
                      <td className="px-4 py-3 border text-right">{row.levels.level5}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LearningSpeedChart({ rows }: { rows: Array<{ department: string; score: number; category: string; employeeCount: number }> }) {
  const width = Math.max(560, rows.length * 120);
  const height = 320;
  const leftPadding = 56;
  const rightPadding = 24;
  const topPadding = 20;
  const bottomPadding = 100;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  const barGap = 16;
  const barWidth = Math.max(20, (chartWidth - barGap * (rows.length - 1)) / rows.length);

  const maxAbs = Math.max(0.001, ...rows.map((r) => Math.abs(r.score)));
  const yScale = (v: number) => (v / maxAbs) * (chartHeight / 2);
  const midY = topPadding + chartHeight / 2;

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: width }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
          {/* Zero line */}
          <line x1={leftPadding} y1={midY} x2={width - rightPadding} y2={midY} stroke="#d4d4d8" strokeWidth="1.5" />

          {/* Y axis ticks */}
          {[-maxAbs, -maxAbs / 2, 0, maxAbs / 2, maxAbs].map((tick, i) => {
            const y = midY - yScale(tick);
            return (
              <g key={i}>
                <line x1={leftPadding - 4} y1={y} x2={leftPadding} y2={y} stroke="#a1a1aa" strokeWidth="1" />
                <text x={leftPadding - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#71717a">
                  {tick.toFixed(3)}
                </text>
              </g>
            );
          })}

          {rows.map((row, index) => {
            const x = leftPadding + index * (barWidth + barGap);
            const barH = Math.abs(yScale(row.score));
            const positive = row.score >= 0;
            const barY = positive ? midY - barH : midY;
            const color = CATEGORY_COLORS[row.category as LearningCategory]?.bg ?? '#71717a';

            return (
              <g key={row.department}>
                <rect x={x} y={barY} width={barWidth} height={Math.max(1, barH)} fill={color} rx={2} />
                <text
                  x={x + barWidth / 2}
                  y={height - 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#71717a"
                  transform={`rotate(-30 ${x + barWidth / 2} ${height - 14})`}
                >
                  {row.department}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 mt-1 px-2">
          {(Object.keys(CATEGORY_LABELS) as LearningCategory[]).map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: CATEGORY_COLORS[cat].bg }} />
              <span>{CATEGORY_LABELS[cat]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillSpectrumChart({ rows }: { rows: any[] }) {
  const width = Math.max(760, rows.length * 140);
  const height = 380;
  const leftPadding = 42;
  const rightPadding = 24;
  const topPadding = 20;
  const bottomPadding = 110;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  const barGap = 18;
  const barWidth = Math.max(22, (chartWidth - barGap * (rows.length - 1)) / rows.length);
  const maxY = Math.max(
    1,
    ...rows.map((row) =>
      row.levels.level0 +
      row.levels.level1 +
      row.levels.level2 +
      row.levels.level3 +
      row.levels.level4 +
      row.levels.level5
    )
  );

  const colors: Record<string, string> = {
    level0: '#2563eb',
    level1: '#ef4444',
    level2: '#84cc16',
    level3: '#7c3aed',
    level4: '#06b6d4',
    level5: '#f59e0b',
  };

  const levelKeys = ['level0', 'level1', 'level2', 'level3', 'level4', 'level5'] as const;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-190">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-80">
          {Array.from({ length: 6 }).map((_, idx) => {
            const tick = Math.round((idx / 5) * maxY);
            const y = topPadding + chartHeight - (tick / maxY) * chartHeight;
            return (
              <g key={idx}>
                <line x1={leftPadding} y1={y} x2={width - rightPadding} y2={y} stroke="#e4e4e7" strokeWidth="1" />
                <text x={8} y={y + 4} fontSize="11" fill="#71717a">{tick}</text>
              </g>
            );
          })}

          {rows.map((row, index) => {
            const x = leftPadding + index * (barWidth + barGap);
            let runningHeight = 0;

            return (
              <g key={row.departmentId}>
                {levelKeys.map((key) => {
                  const value = Number(row.levels[key] ?? 0);
                  const segmentHeight = (value / maxY) * chartHeight;
                  const y = topPadding + chartHeight - runningHeight - segmentHeight;
                  runningHeight += segmentHeight;

                  if (value === 0) return null;

                  return (
                    <g key={`${row.departmentId}-${key}`}>
                      <rect x={x} y={y} width={barWidth} height={segmentHeight} fill={colors[key]} rx={2} />
                      {segmentHeight > 14 ? (
                        <text x={x + barWidth / 2} y={y + segmentHeight / 2 + 3} textAnchor="middle" fontSize="10" fill="white">
                          {value}
                        </text>
                      ) : null}
                    </g>
                  );
                })}

                <text
                  x={x + barWidth / 2}
                  y={height - 26}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#71717a"
                  transform={`rotate(-30 ${x + barWidth / 2} ${height - 26})`}
                >
                  {row.departmentName}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 mt-2 px-2">
          {levelKeys.map((key, idx) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[key] }} />
              <span>Level {idx}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StackedMultiSkillChart({
  rows,
}: {
  rows: Array<{
    department: string;
    atLeast2Pct: number;
    atMost1Pct: number;
  }>;
}) {
  const width = Math.max(760, rows.length * 140);
  const height = 380;
  const leftPadding = 42;
  const rightPadding = 24;
  const topPadding = 28;
  const bottomPadding = 110;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  const barGap = 18;
  const barWidth = Math.max(22, (chartWidth - barGap * (rows.length - 1)) / rows.length);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-190">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-80">
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const y = topPadding + chartHeight - (tick / 100) * chartHeight;
            return (
              <g key={tick}>
                <line x1={leftPadding} y1={y} x2={width - rightPadding} y2={y} stroke="#e4e4e7" strokeWidth="1" />
                <text x={8} y={y + 4} fontSize="11" fill="#71717a">
                  {tick}%
                </text>
              </g>
            );
          })}

          {rows.map((row, index) => {
            const x = leftPadding + index * (barWidth + barGap);
            const greenPct = Math.max(0, Math.min(100, row.atLeast2Pct));
            const redPct = Math.max(0, Math.min(100, row.atMost1Pct));

            const greenHeight = (greenPct / 100) * chartHeight;
            const redHeight = (redPct / 100) * chartHeight;

            const greenY = topPadding + chartHeight - greenHeight;
            const redY = greenY - redHeight;

            return (
              <g key={row.department}>
                <rect x={x} y={greenY} width={barWidth} height={greenHeight} fill="#84cc16" rx={2} />
                <rect x={x} y={redY} width={barWidth} height={redHeight} fill="#ef4444" rx={2} />

                <text x={x + barWidth / 2} y={greenY + Math.min(18, greenHeight / 2)} textAnchor="middle" fontSize="10" fill="#166534">
                  {greenPct}%
                </text>
                <text x={x + barWidth / 2} y={redY + 12} textAnchor="middle" fontSize="10" fill="#991b1b">
                  {redPct}%
                </text>

                <text
                  x={x + barWidth / 2}
                  y={height - 26}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#71717a"
                  transform={`rotate(-30 ${x + barWidth / 2} ${height - 26})`}
                >
                  {row.department}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex items-center gap-6 text-sm text-zinc-600 mt-2 px-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-lime-500" />
            <span>&gt;=2</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-red-500" />
            <span>&lt;=1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
