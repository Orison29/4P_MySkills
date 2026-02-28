'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { recommendationsApi } from '@/api/recommendations.api';
import { projectsApi } from '@/api/projects.api';
import { Sparkles, CheckCircle2, ChevronDown, UserPlus } from 'lucide-react';
import { useState, use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProjectRecommendationsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const [expandedDeliverable, setExpandedDeliverable] = useState<string | null>(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
  });

  const { data: recommendationsData, isLoading } = useQuery({
    queryKey: ['recommendations', 'project', projectId],
    queryFn: () => recommendationsApi.getProjectRecommendations(projectId, 5),
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
        <Link href="/hr/projects" className="hover:text-primary transition">Projects</Link>
        <span>/</span>
        <Link href={`/hr/projects/${projectId}`} className="hover:text-primary transition">{project?.name || 'Project'}</Link>
        <span>/</span>
        <span className="text-zinc-900 font-medium">Recommendations</span>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-indigo-200" />
          <h1 className="text-3xl font-bold tracking-tight">AI Assignment Recommendations</h1>
        </div>
        <p className="text-indigo-100 max-w-2xl text-lg mt-2">
          Based on the deliverable requirements, our AI has found the top 5 employees whose skill profiles best match each task in {project?.name}.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          <p className="text-zinc-500 animate-pulse">Running advanced recommendation algorithms...</p>
        </div>
      ) : recommendationsData?.deliverables?.length === 0 ? (
         <div className="text-center p-12 bg-white border rounded-xl shadow-sm">
          <p className="text-zinc-500">No recommended employees found. Ensure deliverables exist and employees have rated their skills.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendationsData?.deliverables?.map(({ deliverable, employees }: any, index: number) => {
            const isExpanded = expandedDeliverable === deliverable.id || (index === 0 && expandedDeliverable === null);
            
            return (
              <div key={deliverable.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <button 
                  onClick={() => setExpandedDeliverable(isExpanded ? null : deliverable.id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-zinc-50 :bg-zinc-900/50 transition"
                >
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold">{deliverable.name}</h2>
                    <div className="flex gap-2">
                      {deliverable.requiredSkills?.map((rs: any) => (
                        <span key={rs.skillId} className="text-xs bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 ">
                          {rs.skill?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="p-6 pt-2 border-t bg-zinc-50/50 ">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {employees.map((emp: any, idx: number) => (
                        <RecommendationCard key={emp.employeeId} employee={emp} rank={idx + 1} deliverableId={deliverable.id} />
                      ))}
                      {employees.length === 0 && (
                        <div className="col-span-full text-center py-8 text-zinc-500 bg-white rounded-lg border border-dashed">
                          No matching employees found for these specific skills.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ employee, rank, deliverableId }: { employee: any, rank: number, deliverableId: string }) {
  const [showDetails, setShowDetails] = useState(false);

  const requestMutation = useMutation({
    mutationFn: () => recommendationsApi.requestAssignment(deliverableId, employee.employeeId),
    onSuccess: () => toast.success(`Assignment requested for ${employee.fullname}`),
    onError: () => toast.error('Failed to request assignment')
  });

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100 border-green-200 ';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200 ';
    return 'text-orange-600 bg-orange-100 border-orange-200 ';
  };

  const matchColorClass = getMatchColor(employee.matchPercentage);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col relative transition-all duration-300 ${rank === 1 ? 'ring-2 ring-indigo-500 ring-offset-2 ' : ''}`}>
      {rank === 1 && (
        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 uppercase tracking-wide">
          Top Match
        </div>
      )}
      
      <div className="p-5 flex-1 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm uppercase">
              {employee.fullname.substring(0, 2)}
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 ">{employee.fullname}</h3>
              <p className="text-xs text-zinc-500">Overall Score: {(employee.overallScore || 0).toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-zinc-500">Skill Match</span>
            <span className={matchColorClass.split(' ')[0]}>{employee.matchPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${matchColorClass.split(' ')[1]}`} 
              style={{ width: `${employee.matchPercentage}%` }}
            />
          </div>
        </div>

        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {showDetails ? 'Hide breakdown' : 'View skill breakdown'}
        </button>

        {showDetails && (
          <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
            {employee.skillBreakdown?.map((sb: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-zinc-600 w-1/2 truncate">{sb.skillName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Rating:</span>
                  <span className={`font-semibold ${sb.employeeRating ? 'text-zinc-900 ' : 'text-red-500'}`}>
                    {sb.employeeRating || 'Missing'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-zinc-50 border-t">
        <button 
          onClick={() => requestMutation.mutate()}
          disabled={requestMutation.isPending || requestMutation.isSuccess}
          className={`w-full py-2 rounded-md font-medium text-sm transition flex items-center justify-center gap-2 ${
            requestMutation.isSuccess 
              ? 'bg-green-100 text-green-700 ' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {requestMutation.isPending && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          {requestMutation.isSuccess && <CheckCircle2 className="w-4 h-4" />}
          {!requestMutation.isPending && !requestMutation.isSuccess && <UserPlus className="w-4 h-4" />}
          
          {requestMutation.isSuccess ? 'Requested' : 'Request Assignment'}
        </button>
      </div>
    </div>
  );
}
