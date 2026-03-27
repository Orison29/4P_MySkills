'use client';

import { campaignsApi } from '@/api/campaigns.api';
import { employeeSkillsApi, skillsApi } from '@/api/skills.api';
import { RoleGuard } from '@/components/auth/role-guard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function EmployeeSkillRequestPage() {
  const queryClient = useQueryClient();
  const [draftRatings, setDraftRatings] = useState<Record<string, number>>({});

  const { data: activeProgress, isLoading: isCampaignLoading } = useQuery({
    queryKey: ['assessment-campaigns', 'active-me'],
    queryFn: campaignsApi.getMyActiveProgress,
  });

  const { data: skills, isLoading: isSkillsLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getSkills,
  });

  const { data: myRatings, isLoading: isRatingsLoading } = useQuery({
    queryKey: ['employee-skills', 'me'],
    queryFn: employeeSkillsApi.getMyRatings,
  });

  const ratingsMap = useMemo(() => {
    const map = new Map<string, any>();
    (myRatings ?? []).forEach((rating) => {
      map.set(rating.skillId, rating);
    });
    return map;
  }, [myRatings]);

  const createMutation = useMutation({
    mutationFn: employeeSkillsApi.createRating,
    onSuccess: () => {
      toast.success('Skill rating submitted for manager approval');
      queryClient.invalidateQueries({ queryKey: ['employee-skills', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['assessment-campaigns', 'active-me'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to submit skill rating';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, selfRating }: { id: string; selfRating: number }) =>
      employeeSkillsApi.updateRating(id, { selfRating }),
    onSuccess: () => {
      toast.success('Pending rating updated');
      queryClient.invalidateQueries({ queryKey: ['employee-skills', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['assessment-campaigns', 'active-me'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update rating';
      toast.error(message);
    },
  });

  const submitSkillRating = (skillId: string) => {
    const selected = draftRatings[skillId] ?? 3;
    const existing = ratingsMap.get(skillId);

    if (!existing) {
      createMutation.mutate({ skillId, selfRating: selected });
      return;
    }

	updateMutation.mutate({ id: existing.id, selfRating: selected });
  };

  const isLoading = isCampaignLoading || isSkillsLoading || isRatingsLoading;
  const activeCampaign = activeProgress?.activeCampaign;

  return (
    <RoleGuard allowedRoles={['EMPLOYEE']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skill Rating Request</h1>
          <p className="text-muted-foreground mt-1">
            View all skills and submit your self-ratings for manager approval.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white border rounded-xl p-8 text-center text-zinc-500">Loading...</div>
        ) : !activeCampaign ? (
          <div className="bg-white border rounded-xl p-8 text-center text-zinc-600">
            There is no active skill rating request right now.
          </div>
        ) : (
          <>
            <div className="bg-white border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold">Active Request</h2>
              <p className="text-zinc-600 mt-1">
                {activeCampaign.title} is active until{' '}
                <span className="font-semibold">{new Date(activeCampaign.endAt).toLocaleString()}</span>.
                Your ratings will be reviewed by your manager.
              </p>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold">All Skills</h2>
              </div>

              {(skills?.length ?? 0) === 0 ? (
                <div className="p-8 text-center text-zinc-500">No skills found in catalog.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-zinc-600">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Skill</th>
                        <th className="text-left px-4 py-3 font-medium">Current Status</th>
                        <th className="text-left px-4 py-3 font-medium">Your Rating</th>
                        <th className="text-left px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(skills ?? []).map((skill) => {
                        const existing = ratingsMap.get(skill.id);
                        const status = existing?.status ?? 'NOT_RATED';
                        const defaultValue = existing?.selfRating ?? 3;
                        const selected = draftRatings[skill.id] ?? defaultValue;

                        return (
                          <tr key={skill.id} className="border-t">
                            <td className="px-4 py-3">
                              <div className="font-medium">{skill.name}</div>
                              {skill.description ? (
                                <div className="text-xs text-zinc-500 mt-0.5">{skill.description}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={status} />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                className="rounded-md border p-2 bg-white"
                                value={selected}
                                onChange={(e) =>
                                  setDraftRatings((prev) => ({
                                    ...prev,
                                    [skill.id]: Number(e.target.value),
                                  }))
                                }
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => submitSkillRating(skill.id)}
                                disabled={
                                  createMutation.isPending ||
                                  updateMutation.isPending
                                }
                                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                              >
                                Rate Now
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED') {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">APPROVED</span>;
  }
  if (status === 'EDITED') {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">EDITED</span>;
  }
  if (status === 'PENDING') {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">PENDING</span>;
  }
  if (status === 'REJECTED') {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">REJECTED</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-700">NOT RATED</span>;
}
