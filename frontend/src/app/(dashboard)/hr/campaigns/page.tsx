'use client';

import { campaignsApi } from '@/api/campaigns.api';
import { RoleGuard } from '@/components/auth/role-guard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const toLocalDatetimeInput = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function HRCampaignsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['assessment-campaigns'],
    queryFn: campaignsApi.list,
  });

  useEffect(() => {
    if (!campaigns?.length) {
      setSelectedCampaignIds([]);
      return;
    }

    setSelectedCampaignIds((prev) => {
      const valid = prev.filter((id) => campaigns.some((campaign) => campaign.id === id));
      if (valid.length > 0) return valid;
      return [campaigns[0].id];
    });
  }, [campaigns]);

  const orderedSelectedCampaignIds = useMemo(() => {
    const selected = new Set(selectedCampaignIds);
    return (campaigns ?? [])
      .filter((campaign) => selected.has(campaign.id))
      .map((campaign) => campaign.id);
  }, [campaigns, selectedCampaignIds]);

  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaignIds((prev) => {
      if (prev.includes(campaignId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== campaignId);
      }
      return [...prev, campaignId];
    });
  };

  const selectedCampaigns = useMemo(() => {
    const selected = new Set(orderedSelectedCampaignIds);
    return (campaigns ?? []).filter((campaign) => selected.has(campaign.id));
  }, [campaigns, orderedSelectedCampaignIds]);

  const { data: selectedCoverages = [], isLoading: isCoverageLoading } = useQuery({
    queryKey: ['assessment-campaigns', 'coverage-multi', orderedSelectedCampaignIds],
    queryFn: () => Promise.all(orderedSelectedCampaignIds.map((id) => campaignsApi.getCoverage(id))),
    enabled: orderedSelectedCampaignIds.length > 0,
  });

  const singleCoverage = selectedCoverages[0] ?? null;
  const isMultiMode = orderedSelectedCampaignIds.length > 1;

  const groupedChartData = useMemo(() => {
    if (!isMultiMode || selectedCoverages.length === 0) {
      return { labels: [], series: [] as { name: string; color: string; values: number[] }[] };
    }

    const departmentSet = new Set<string>();
    selectedCoverages.forEach((coverage) => {
      coverage.departments.forEach((department) => departmentSet.add(department.departmentName));
    });

    const labels = Array.from(departmentSet);
    const palette = ['#2b6cb0', '#c05621', '#2f855a', '#b83280', '#2c5282', '#9b2c2c', '#744210'];

    const series = selectedCoverages.map((coverage, index) => {
      const map = new Map(
        coverage.departments.map((department) => [department.departmentName, department.current.coveragePct])
      );
      return {
        name: coverage.campaign.title,
        color: palette[index % palette.length],
        values: labels.map((label) => map.get(label) ?? 0),
      };
    });

    return { labels, series };
  }, [isMultiMode, selectedCoverages]);

  const createMutation = useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: () => {
      toast.success('Skill rating campaign created successfully');
      queryClient.invalidateQueries({ queryKey: ['assessment-campaigns'] });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to create campaign';
      toast.error(msg);
    },
  });

  const updateStateMutation = useMutation({
    mutationFn: ({ campaignId, state }: { campaignId: string; state: 'SCHEDULED' | 'ACTIVE' | 'CLOSED' }) =>
      campaignsApi.updateState(campaignId, state),
    onSuccess: () => {
      toast.success('Campaign state updated');
      queryClient.invalidateQueries({ queryKey: ['assessment-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['assessment-campaigns', 'coverage-multi'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to update campaign state';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (campaignId: string) => campaignsApi.delete(campaignId),
    onSuccess: () => {
      toast.success('Campaign deleted');
      queryClient.invalidateQueries({ queryKey: ['assessment-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['assessment-campaigns', 'coverage-multi'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to delete campaign';
      toast.error(msg);
    },
  });

  const activeCount = useMemo(
    () => campaigns?.filter((campaign) => campaign.status === 'ACTIVE').length ?? 0,
    [campaigns]
  );

  return (
    <RoleGuard allowedRoles={['HR', 'ADMIN']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Skill Rating Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage HR skill rating campaigns for department coverage tracking.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <p className="text-sm text-zinc-500">Total Campaigns</p>
            <p className="text-2xl font-bold mt-1">{isLoading ? '-' : campaigns?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <p className="text-sm text-zinc-500">Active Campaigns</p>
            <p className="text-2xl font-bold mt-1">{isLoading ? '-' : activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold">Department Coverage Trend</h2>
              <p className="text-sm text-zinc-500">
                Select one campaign for detailed comparison, or select multiple campaigns for department-wise grouped comparison.
              </p>
            </div>

            <div className="min-w-80 max-h-48 overflow-auto rounded-lg border bg-zinc-50 p-3">
              <p className="text-xs text-zinc-500 mb-2">Campaign Filter</p>
              <div className="space-y-2">
                {(campaigns ?? []).map((campaign) => {
                  const checked = selectedCampaignIds.includes(campaign.id);
                  return (
                    <label key={campaign.id} className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCampaignSelection(campaign.id)}
                        className="accent-primary"
                      />
                      <span className="truncate">{campaign.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {isCoverageLoading ? (
            <div className="h-72 flex items-center justify-center text-zinc-500">Loading chart...</div>
          ) : isMultiMode ? (
            groupedChartData.labels.length ? (
              <div className="space-y-4">
                <GroupedDepartmentBarChart labels={groupedChartData.labels} series={groupedChartData.series} />
                <div className="text-xs text-zinc-500">
                  Comparing {selectedCampaigns.length} campaigns department-wise.
                </div>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-zinc-500">
                No department coverage data available for selected campaigns.
              </div>
            )
          ) : singleCoverage?.departments?.length ? (
            <div className="space-y-4">
              <SingleCampaignVerticalChart
                labels={singleCoverage.departments.map((department) => department.departmentName)}
                values={singleCoverage.departments.map((department) => department.current.coveragePct)}
                campaignLabel={singleCoverage.campaign.title}
              />

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="p-3 rounded-lg bg-zinc-50 border">
                  <p className="text-xs text-zinc-500">Total Employees</p>
                  <p className="text-lg font-bold">{singleCoverage.summary.totalEmployees}</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 border">
                  <p className="text-xs text-zinc-500">Compliant</p>
                  <p className="text-lg font-bold">{singleCoverage.summary.compliantEmployees}</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 border">
                  <p className="text-xs text-zinc-500">Non-Compliant</p>
                  <p className="text-lg font-bold">{singleCoverage.summary.nonCompliantEmployees}</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 border">
                  <p className="text-xs text-zinc-500">Coverage</p>
                  <p className="text-lg font-bold">{singleCoverage.summary.coveragePct}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-zinc-500">
              No department coverage data available for selected campaign.
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold">Campaign List</h2>
          </div>
          {isLoading ? (
            <div className="p-10 text-center text-zinc-500">Loading campaigns...</div>
          ) : campaigns?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Title</th>
                    <th className="text-left px-4 py-3 font-medium">Window</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Created By</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{campaign.title}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {new Date(campaign.startAt).toLocaleDateString()} - {new Date(campaign.endAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            campaign.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : campaign.status === 'SCHEDULED'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {campaign.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{campaign.creator?.email || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            className="rounded-md border p-1.5 text-xs bg-white"
                            value={campaign.status || 'SCHEDULED'}
                            onChange={(e) =>
                              updateStateMutation.mutate({
                                campaignId: campaign.id,
                                state: e.target.value as 'SCHEDULED' | 'ACTIVE' | 'CLOSED',
                              })
                            }
                            disabled={updateStateMutation.isPending || deleteMutation.isPending}
                          >
                            <option value="SCHEDULED">SCHEDULED</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>

                          <button
                            className="px-2.5 py-1.5 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50"
                            onClick={() => {
                              if (confirm(`Delete campaign \"${campaign.title}\"?`)) {
                                deleteMutation.mutate(campaign.id);
                              }
                            }}
                            disabled={updateStateMutation.isPending || deleteMutation.isPending}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-zinc-500">No campaigns yet. Create your first campaign.</div>
          )}
        </div>

        {isCreateOpen && (
          <CreateCampaignModal
            onClose={() => setIsCreateOpen(false)}
            onSubmit={(payload) => createMutation.mutate(payload)}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </RoleGuard>
  );
}

function SingleCampaignVerticalChart({
  labels,
  values,
  campaignLabel,
}: {
  labels: string[];
  values: number[];
  campaignLabel: string;
}) {
  const width = Math.max(760, labels.length * 170);
  const height = 300;
  const padding = 36;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barGap = 16;
  const barWidth = Math.max(22, (chartWidth - barGap * (labels.length - 1)) / labels.length);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-190">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-80">
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const y = padding + chartHeight - (tick / 100) * chartHeight;
            return (
              <g key={tick}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e4e4e7" strokeWidth="1" />
                <text x={8} y={y + 4} fontSize="11" fill="#71717a">
                  {tick}%
                </text>
              </g>
            );
          })}

          {labels.map((label, index) => {
            const value = values[index] ?? 0;
            const clamped = Math.max(0, Math.min(100, value));
            const barHeight = (clamped / 100) * chartHeight;
            const x = padding + index * (barWidth + barGap);
            const y = padding + chartHeight - barHeight;

            return (
              <g key={label}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill="#2563eb" rx={2} />
                <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#3f3f46">
                  {clamped}%
                </text>
                <text x={x + barWidth / 2} y={height - 8} fontSize="11" fill="#71717a" textAnchor="middle">
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex items-center gap-6 text-sm text-zinc-600 mt-2 px-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span>{campaignLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupedDepartmentBarChart({
  labels,
  series,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
}) {
  if (!labels.length || !series.length) return null;

  const width = Math.max(760, labels.length * 170);
  const height = 300;
  const padding = 36;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const groupWidth = chartWidth / labels.length;
  const groupInnerWidth = groupWidth * 0.8;
  const groupOffset = groupWidth * 0.1;
  const barGap = 6;
  const barWidth = Math.max(10, (groupInnerWidth - barGap * (series.length - 1)) / series.length);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-190">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-80">
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const y = padding + chartHeight - (tick / 100) * chartHeight;
            return (
              <g key={tick}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e4e4e7" strokeWidth="1" />
                <text x={6} y={y + 4} fontSize="11" fill="#71717a">
                  {tick}%
                </text>
              </g>
            );
          })}

          {labels.map((label, labelIndex) => {
            const groupStartX = padding + labelIndex * groupWidth + groupOffset;

            return (
              <g key={label}>
                {series.map((serie, seriesIndex) => {
                  const value = serie.values[labelIndex] ?? 0;
                  const clampedValue = Math.max(0, Math.min(100, value));
                  const barHeight = (clampedValue / 100) * chartHeight;
                  const x = groupStartX + seriesIndex * (barWidth + barGap);
                  const y = padding + chartHeight - barHeight;

                  return (
                    <g key={`${label}-${serie.name}`}>
                      <rect x={x} y={y} width={barWidth} height={barHeight} fill={serie.color} rx={2} />
                      <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#3f3f46">
                        {clampedValue}%
                      </text>
                    </g>
                  );
                })}

                <text
                  x={groupStartX + groupInnerWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#71717a"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-2 flex flex-wrap items-center gap-4 px-2 text-sm text-zinc-600">
          {series.map((serie) => (
            <div key={serie.name} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: serie.color }} />
              <span>{serie.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateCampaignModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    startAt: string;
    endAt: string;
  }) => void;
  isSubmitting: boolean;
}) {
  const now = new Date();
  const plusTen = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState(toLocalDatetimeInput(now));
  const [endAt, setEndAt] = useState(toLocalDatetimeInput(plusTen));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Campaign title is required');
      return;
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error('Please provide valid start and end date/time');
      return;
    }

    if (start >= end) {
      toast.error('End date/time must be after start date/time');
      return;
    }

    onSubmit({
      title: title.trim(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 border shadow-xl">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Create Skill Rating Campaign</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Campaign Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200"
              placeholder="Example: Q2 Skills Coverage Drive"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                required
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-zinc-200 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
