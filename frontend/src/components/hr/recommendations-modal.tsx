'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { recommendationsApi } from '@/api/recommendations.api';
import { X, UserPlus, CheckCircle2, TrendingUp, Presentation } from 'lucide-react';
import { toast } from 'sonner';

export function RecommendationsModal({ deliverable, onClose }: { deliverable: any, onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', deliverable.id],
    queryFn: () => recommendationsApi.getDeliverableRecommendations(deliverable.id, 1000),
  });

  const requestAssignmentMutation = useMutation({
    mutationFn: (employeeId: string) => recommendationsApi.requestAssignment(deliverable.id, employeeId),
    onSuccess: () => toast.success('Assignment request sent to manager!'),
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to send request')
  });

  const topEmployees = data?.topEmployees || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full p-0 shadow-xl border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b bg-zinc-50 flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-3 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> AI Match
            </div>
            <h2 className="text-xl font-bold">Eligible Employees</h2>
            <p className="text-sm text-zinc-500 mt-1">Showing all employees sorted by exact skill match for: <span className="font-medium text-zinc-700">{deliverable.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition bg-zinc-100">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-sm text-zinc-500">Analyzing organization graph for best matches...</p>
            </div>
          ) : topEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Presentation className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900">No matches found</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">Either this deliverable requires no skills, or no employees in the organization have the required skills.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topEmployees.map((rec: any, index: number) => {
                const isTopMatch = index === 0;
                return (
                  <div key={rec.employeeId} className={`border rounded-xl p-5 relative overflow-hidden transition ${isTopMatch ? 'border-indigo-200 bg-indigo-50/30' : 'bg-white hover:border-zinc-300'}`}>
                    {isTopMatch && (
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-bl-lg">
                        Best Match
                      </div>
                    )}
                    
                    <div className="flex items-start flex-col sm:flex-row gap-4 justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-zinc-900">{rec.employeeName}</h3>
                          <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{rec.departmentName || 'No Dept'}</span>
                        </div>
                        <p className="text-sm text-zinc-500 mt-1 mb-4 flex items-center gap-2">
                          Matches {rec.skillMatches.filter((s: any) => s.employeeRating !== null).length}/{rec.skillMatches.length} selected skills
                        </p>
                        
                        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
                          {rec.skillMatches.map((sm: any, i: number) => (
                            <div key={i} className="flex flex-col border border-zinc-100 bg-zinc-50 rounded-md px-3 py-2">
                              <span className="text-xs font-medium text-zinc-700 truncate w-32" title={sm.skillName}>{sm.skillName}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-bold ${sm.employeeRating ? 'text-green-600' : 'text-red-500'}`}>
                                  {sm.employeeRating || 'Missing'}
                                </span>
                                {sm.employeeRating && <span className="text-[10px] text-zinc-400 font-medium">Wt: {sm.requiredWeight}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-center sm:items-end justify-between shrink-0 min-w-[120px]">
                        <div className="text-center sm:text-right mb-4">
                          <div className="text-3xl font-black text-indigo-600">
                            {Math.round(rec.coveragePercentage)}%
                          </div>
                          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Coverage</div>
                          <div className="text-xs font-medium text-indigo-500 mt-1" title="Skill Index">
                            Skill Index: {rec.totalSkillIndex.toFixed(1)}
                          </div>
                        </div>

                        <button 
                          onClick={() => requestAssignmentMutation.mutate(rec.employeeId)}
                          disabled={requestAssignmentMutation.isPending}
                          className="w-full sm:w-auto px-4 py-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 text-sm font-medium rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                        >
                          <UserPlus className="w-4 h-4" /> Request
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
