'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi } from '@/api/skills.api';
import { Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function HRSkillsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getSkills,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skills Catalog</h1>
          <p className="text-muted-foreground mt-1">Manage standard skills across the organization.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Skill
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : skills?.length === 0 ? (
        <div className="text-center p-12 bg-white border rounded-xl shadow-sm">
          <Star className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 ">No skills found</h3>
          <p className="text-zinc-500 mt-1">Add skills to build the organizational catalog.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 font-medium border-b hidden sm:table-header-group">
              <tr>
                <th className="px-6 py-4">Skill Name</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {skills?.map((skill) => (
                <tr key={skill.id} className="hover:bg-zinc-50 :bg-zinc-900/50 transition flex flex-col sm:table-row">
                  <td className="px-6 py-4 font-medium sm:w-1/3">{skill.name}</td>
                  <td className="px-6 py-2 sm:py-4 text-zinc-500">{skill.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateSkillModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}

function CreateSkillModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: '', description: '' });

  const createMutation = useMutation({
    mutationFn: skillsApi.createSkill,
    onSuccess: () => {
      toast.success('Skill created successfully');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to create skill');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border">
        <h2 className="text-xl font-bold mb-4">Create New Skill</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Skill Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g., React.js"
              className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 "
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              required
              placeholder="Briefly describe this skill..."
              className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 h-24"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
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
              {createMutation.isPending ? 'Saving...' : 'Create Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
