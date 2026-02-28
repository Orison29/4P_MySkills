'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects.api';
import { Plus, Trash2, Bot, Calendar, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => {
      toast.error('Failed to delete project');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage organizational projects and assignments.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center p-12 bg-white border rounded-xl shadow-sm">
          <BriefcaseIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 ">No projects found</h3>
          <p className="text-zinc-500 mt-1">Get started by creating a new project.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects?.map((project) => (
            <div key={project.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-shadow">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold line-clamp-1">{project.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'ACTIVE' ? 'bg-green-100 text-green-700 ' :
                    project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 ' :
                    'bg-zinc-100 text-zinc-700 '
                  }`}>
                    {project.status}
                  </span>
                </div>
                
                <p className="text-zinc-500 text-sm line-clamp-2 mb-4">
                  {project.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                  {project.startDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(project.startDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-zinc-50 p-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 :bg-red-950/30 rounded-md transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <Link 
                  href={`/hr/projects/${project.id}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateProjectModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}

function BriefcaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}

// In a real app this would be a separate component file
function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: '', description: '', startDate: '', endDate: '' });

  const createMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      toast.success('Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to create project');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border">
        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input 
              required
              type="text" 
              className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 "
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              required
              className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 h-24"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 "
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input 
                type="date" 
                className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 "
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-zinc-200 :bg-zinc-700 rounded-md transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
