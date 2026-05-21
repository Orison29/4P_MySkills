'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi } from '@/api/skills.api';
import { Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function HRSkillsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<{
    processed: number;
    created: number;
    ignored: number;
    failed: number;
    errors: { row: number; field: string; error: string }[];
  } | null>(null);

  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getSkills,
  });

  const ingestMutation = useMutation({
    mutationFn: (file: File) => skillsApi.ingestSkills(file, 'ignore'),
    onSuccess: (summary) => {
      setUploadSummary(summary);
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skills uploaded successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to upload skills';
      toast.error(msg);
    },
  });

  const handleFileChange = async (file: File | null) => {
    setUploadSummary(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only .csv files are allowed');
      setSelectedFile(null);
      return;
    }

    try {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/)[0] || '';
      if (firstLine.trim().toLowerCase() !== 'skills') {
        toast.error('Invalid CSV header. First column must be Skills');
        setSelectedFile(null);
        return;
      }
    } catch {
      toast.error('Could not read the file. Please try again.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please choose a CSV file first');
      return;
    }
    ingestMutation.mutate(selectedFile);
  };

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

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Upload Skills CSV</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Upload a CSV with a single column named Skills. Duplicate skills are skipped automatically.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <div className="space-y-2">
            <label className="block text-sm font-medium">CSV File</label>
            <Input
              type="file"
              accept=".csv"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-zinc-500">Required header: Skills</p>
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || ingestMutation.isPending}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {ingestMutation.isPending ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>

        {uploadSummary && (
          <div className="rounded-lg border bg-zinc-50 p-4">
            <div className="grid gap-3 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-zinc-500">Processed</p>
                <p className="font-semibold text-zinc-900">{uploadSummary.processed}</p>
              </div>
              <div>
                <p className="text-zinc-500">Created</p>
                <p className="font-semibold text-emerald-700">{uploadSummary.created}</p>
              </div>
              <div>
                <p className="text-zinc-500">Ignored</p>
                <p className="font-semibold text-zinc-700">{uploadSummary.ignored}</p>
              </div>
              <div>
                <p className="text-zinc-500">Failed</p>
                <p className="font-semibold text-red-600">{uploadSummary.failed}</p>
              </div>
            </div>

            {uploadSummary.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-700 mb-2">Errors</p>
                <div className="max-h-40 overflow-auto rounded-md border bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 text-zinc-500">
                      <tr>
                        <th className="text-left px-3 py-2">Row</th>
                        <th className="text-left px-3 py-2">Field</th>
                        <th className="text-left px-3 py-2">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadSummary.errors.map((error, index) => (
                        <tr key={`${error.row}-${index}`} className="border-t">
                          <td className="px-3 py-2">{error.row}</td>
                          <td className="px-3 py-2">{error.field}</td>
                          <td className="px-3 py-2 text-red-600">{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
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
