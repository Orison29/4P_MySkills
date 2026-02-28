'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi } from '@/api/skills.api';
import { deliverableSkillsApi } from '@/api/deliverables.api';
import { X, Trash2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

export function ManageSkillsModal({ deliverable, onClose }: { deliverable: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [newSkillWeight, setNewSkillWeight] = useState(5);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initial: Record<string, number> = {};
    deliverable.requiredSkills?.forEach((rs: any) => {
      initial[rs.skillId] = Math.round(rs.weight * 10);
    });
    setLocalWeights(initial);
  }, [deliverable]);

  const { data: allSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getSkills,
  });

  // Filter out skills that are already added
  const availableSkills = allSkills?.filter(
    skill => !deliverable.requiredSkills?.some((rs: any) => rs.skillId === skill.id)
  );

  const addSkillMutation = useMutation({
    mutationFn: () => deliverableSkillsApi.addSkill(deliverable.id, selectedSkillId, newSkillWeight / 10),
    onSuccess: () => {
      toast.success('Skill added to deliverable');
      queryClient.invalidateQueries({ queryKey: ['deliverables', deliverable.projectId] });
      setSelectedSkillId('');
      setNewSkillWeight(5);
    },
    onError: () => toast.error('Failed to add skill')
  });

  const updateWeightMutation = useMutation({
    mutationFn: ({ skillId, weight }: { skillId: string, weight: number }) => 
      deliverableSkillsApi.updateSkillWeight(deliverable.id, skillId, weight / 10),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', deliverable.projectId] });
    },
    onError: () => toast.error('Failed to update weight')
  });

  const handleSave = async () => {
    setIsSaving(true);
    const promises = [];
    for (const rs of deliverable.requiredSkills || []) {
      const currentLoc = localWeights[rs.skillId];
      if (currentLoc !== undefined && currentLoc !== Math.round(rs.weight * 10)) {
        promises.push(updateWeightMutation.mutateAsync({ skillId: rs.skillId, weight: currentLoc }));
      }
    }
    
    try {
      if (promises.length > 0) {
        await Promise.all(promises);
        toast.success('Skill weights updated successfully');
      }
      onClose();
    } catch (e) {
      toast.error('Failed to update some weights');
    } finally {
      setIsSaving(false);
    }
  };

  const removeSkillMutation = useMutation({
    mutationFn: (skillId: string) => deliverableSkillsApi.removeSkill(deliverable.id, skillId),
    onSuccess: () => {
      toast.success('Skill removed');
      queryClient.invalidateQueries({ queryKey: ['deliverables', deliverable.projectId] });
    },
    onError: () => toast.error('Failed to remove skill')
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Manage Required Skills</h2>
            <p className="text-sm text-zinc-500">Deliverable: {deliverable.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Add New Skill Section */}
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
            <h3 className="text-sm font-semibold mb-3">Add Required Skill</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">Select Skill</label>
                <select 
                  className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
                  value={selectedSkillId}
                  onChange={e => setSelectedSkillId(e.target.value)}
                >
                  <option value="">-- Choose a skill --</option>
                  {availableSkills?.map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-zinc-500 mb-1">Weight (1-10)</label>
                <input 
                  type="number" 
                  min="1" max="10" 
                  className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={newSkillWeight}
                  onChange={e => setNewSkillWeight(Number(e.target.value))}
                />
              </div>
              <button 
                onClick={() => addSkillMutation.mutate()}
                disabled={!selectedSkillId || addSkillMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md transition disabled:opacity-50 flex items-center gap-2 h-[38px]"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Current Skills List */}
          <div>
            <h3 className="text-sm font-semibold mb-3 border-b pb-2">Current Required Skills</h3>
            {deliverable.requiredSkills?.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No skills required for this deliverable yet.</p>
            ) : (
              <div className="space-y-3">
                {deliverable.requiredSkills?.map((rs: any) => {
                  const currentWeight = localWeights[rs.skillId] ?? Math.round(rs.weight * 10);
                  return (
                    <div key={rs.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-zinc-300 transition group bg-white">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-sm text-zinc-900">{rs.skill?.name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <input 
                            type="range" 
                            min="1" max="10" 
                            value={currentWeight}
                            onChange={(e) => setLocalWeights(prev => ({ ...prev, [rs.skillId]: Number(e.target.value) }))}
                            className="flex-1 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <span className="text-xs font-semibold text-zinc-500 w-12 text-right">
                            {currentWeight} / 10
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeSkillMutation.mutate(rs.skillId)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition opacity-0 group-hover:opacity-100"
                        title="Remove Skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-zinc-200 :bg-zinc-700 rounded-md transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
