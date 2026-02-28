'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects.api';
import { Bot, Plus, Trash2, ArrowLeft, ChevronRight, Zap } from 'lucide-react';
import { useState, use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ManageSkillsModal } from '@/components/hr/manage-skills-modal';
import { RecommendationsModal } from '@/components/hr/recommendations-modal';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const queryClient = useQueryClient();
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [activeManageSkillsDeliverable, setActiveManageSkillsDeliverable] = useState<any | null>(null);
  const [activeRecommendationsDeliverable, setActiveRecommendationsDeliverable] = useState<any | null>(null);

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
  });

  const { data: deliverables, isLoading: isDeliverablesLoading } = useQuery({
    queryKey: ['deliverables', projectId],
    queryFn: () => projectsApi.getProjectDeliverables(projectId),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => projectsApi.updateProjectStatus(projectId, newStatus),
    onSuccess: () => {
      toast.success('Project status updated');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to update status')
  });

  if (isProjectLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
        <Link href="/hr/projects" className="hover:text-primary transition">Projects</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-zinc-900 font-medium">{project.name}</span>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{project.name}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                'bg-zinc-100 text-zinc-700'
              }`}>
                {project.status}
              </span>
              <select 
                className="text-xs bg-zinc-50 border border-zinc-200 rounded-md py-1 px-2 text-zinc-600 outline-none focus:ring-2 focus:ring-primary/20"
                value={project.status}
                onChange={(e) => statusMutation.mutate(e.target.value)}
                disabled={statusMutation.isPending}
              >
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-md hover:opacity-90 transition shadow-sm"
            >
              <Bot className="w-4 h-4" />
              Analyze with AI
            </button>
          </div>
        </div>
        
        <p className="text-zinc-600 mt-4 leading-relaxed max-w-3xl">
          {project.description}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Deliverables</h2>
          <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Manually
          </button>
        </div>

        {isDeliverablesLoading ? (
           <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
        ) : deliverables?.length === 0 ? (
          <div className="text-center p-12 bg-white border rounded-xl shadow-sm border-dashed">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 ">No deliverables yet</h3>
            <p className="text-zinc-500 mt-1 max-w-sm mx-auto mb-6">Use AI to automatically break down this project into deliverables and assign required skills.</p>
            <button 
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="inline-flex items-center gap-2 bg-zinc-900 text-zinc-50 px-4 py-2 rounded-md hover:bg-zinc-800 :bg-zinc-200 transition"
            >
              <Bot className="w-4 h-4" /> Generate with AI
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {deliverables?.map(del => (
              <div key={del.id} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between group">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{del.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{del.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {del.requiredSkills?.map((rs: any) => (
                      <span key={rs.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100 flex items-center gap-1.5">
                        {rs.skill?.name}
                        <span className="text-blue-400 opacity-70">{(rs.weight * 10).toFixed(0)}/10</span>
                      </span>
                    ))}
                    {(!del.requiredSkills || del.requiredSkills.length === 0) && (
                      <span className="text-xs text-zinc-400 italic">No skills assigned</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:flex-col md:justify-center md:border-l md:pl-5 md:w-48 shrink-0">
                  <button 
                    onClick={() => setActiveRecommendationsDeliverable(del)}
                    className="w-full px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition disabled:opacity-50"
                  >
                    Get Recommendations
                  </button>
                  <button 
                    onClick={() => setActiveManageSkillsDeliverable(del)}
                    className="w-full px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 :bg-zinc-800 rounded-md text-sm font-medium transition cursor-pointer"
                  >
                    Manage Skills
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAnalyzeModalOpen && (
        <AnalyzeProjectModal 
          projectId={projectId} 
          onClose={() => setIsAnalyzeModalOpen(false)} 
        />
      )}

      {activeManageSkillsDeliverable && (
        <ManageSkillsModal 
          deliverable={activeManageSkillsDeliverable} 
          onClose={() => setActiveManageSkillsDeliverable(null)} 
        />
      )}

      {activeRecommendationsDeliverable && (
        <RecommendationsModal 
          deliverable={activeRecommendationsDeliverable} 
          onClose={() => setActiveRecommendationsDeliverable(null)} 
        />
      )}
    </div>
  );
}

function AnalyzeProjectModal({ projectId, onClose }: { projectId: string, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');

  const analyzeMutation = useMutation({
    mutationFn: () => projectsApi.analyzeProject(projectId, prompt),
    onSuccess: (data) => {
      toast.success(data.message || `Analysis complete. Generated ${data.deliverables?.length || 0} deliverables.`);
      queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
      onClose();
    },
    onError: () => {
      toast.error('AI Analysis failed. Please try again.');
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Analyze Project with AI</h2>
            <p className="text-sm text-zinc-500">Google Gemini will break this down into specific deliverables.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Additional context or specific requirements (Optional)</label>
            <textarea 
              className="w-full rounded-md border p-3 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 h-32 resize-none placeholder-zinc-400"
              placeholder="E.g., This project needs a payment gateway using Stripe, user authentication with JWT, and a React frontend..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={analyzeMutation.isPending}
            />
          </div>

          {analyzeMutation.isPending && (
            <div className="bg-indigo-50 p-4 rounded-lg flex items-center gap-3 border border-indigo-100 ">
               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 "></div>
               <p className="text-sm text-indigo-700 font-medium">Analyzing project and extracting required skills... This may take a moment.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              disabled={analyzeMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-zinc-200 :bg-zinc-700 rounded-md transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 rounded-md transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {analyzeMutation.isPending ? 'Processing...' : 'Start Analysis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
