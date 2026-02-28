'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeSkillsApi, skillsApi } from '@/api/skills.api';
import { Plus, Edit2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function MySkillsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRating, setEditingRating] = useState<any>(null);

  const { data: myRatings, isLoading } = useQuery({
    queryKey: ['employee-skills', 'me'],
    queryFn: employeeSkillsApi.getMyRatings,
  });

  const handleEditClick = (rating: any) => {
    setEditingRating(rating);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRating(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Skills</h1>
          <p className="text-muted-foreground mt-1">Manage and track your skill ratings.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Skill Rating
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : myRatings?.length === 0 ? (
        <div className="text-center p-12 bg-white border rounded-xl shadow-sm">
          <StarIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 ">No skills rated yet</h3>
          <p className="text-zinc-500 mt-1">Start by self-rating your first skill.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myRatings?.map((rating) => (
            <div key={rating.id} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{rating.skill?.name}</h3>
                <StatusBadge status={rating.status} />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-500">Self Rating</span>
                    <span className="font-medium">{rating.selfRating}/5</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(rating.selfRating / 5) * 100}%` }}></div>
                  </div>
                </div>

                {rating.approvedRating !== null && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-500">Manager Approved</span>
                      <span className="font-medium text-green-600">{rating.approvedRating}/5</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(rating.approvedRating / 5) * 100}%` }}></div>
                    </div>
                  </div>
                )}
                
                {rating.reviewComment && (
                  <div className="bg-zinc-50 p-3 rounded-md text-sm border italic">
                    <span className="font-semibold not-italic mr-1">Feedback:</span>
                    "{rating.reviewComment}"
                  </div>
                )}
              </div>

              {(rating.status === 'PENDING' || rating.status === 'REJECTED') && (
                <button 
                  onClick={() => handleEditClick(rating)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-zinc-50 border hover:bg-zinc-100 :bg-zinc-800 py-2 rounded-md text-sm font-medium transition"
                >
                  <Edit2 className="w-4 h-4" /> {rating.status === 'REJECTED' ? 'Resubmit Rating' : 'Edit Pending Rating'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <SkillRatingModal 
          rating={editingRating} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'APPROVED':  return <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full"><CheckCircle2 className="w-3.5 h-3.5"/> Approved</span>;
    case 'PENDING':   return <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full"><Clock className="w-3.5 h-3.5"/> Pending</span>;
    case 'EDITED':    return <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full"><Edit2 className="w-3.5 h-3.5"/> Edited</span>;
    case 'REJECTED':  return <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-full"><AlertCircle className="w-3.5 h-3.5"/> Rejected</span>;
    default:          return <span>{status}</span>;
  }
}

function SkillRatingModal({ rating, onClose }: { rating?: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [skillId, setSkillId] = useState(rating?.skillId || '');
  const [selfRating, setSelfRating] = useState(rating?.selfRating || 3);

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getSkills,
  });

  const createMutation = useMutation({
    mutationFn: employeeSkillsApi.createRating,
    onSuccess: () => {
      toast.success('Skill rating submitted');
      queryClient.invalidateQueries({ queryKey: ['employee-skills', 'me'] });
      onClose();
    },
    onError: () => toast.error('Failed to submit rating')
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => employeeSkillsApi.updateRating(rating.id, data),
    onSuccess: () => {
      toast.success('Rating updated');
      queryClient.invalidateQueries({ queryKey: ['employee-skills', 'me'] });
      onClose();
    },
    onError: () => toast.error('Failed to update rating')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating && rating.status === 'PENDING') {
      updateMutation.mutate({ selfRating });
    } else {
      createMutation.mutate({ skillId, selfRating });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border">
        <h2 className="text-xl font-bold mb-4">
          {rating ? (rating.status === 'REJECTED' ? 'Resubmit Skill Rating' : 'Update Self-Rating') : 'Add Skill Rating'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!rating && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Skill</label>
              <select 
                required
                className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 "
                value={skillId}
                onChange={e => setSkillId(e.target.value)}
              >
                <option value="" disabled>Choose a skill...</option>
                {skills?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Self-Rating: <span className="text-primary font-bold text-lg">{selfRating}</span>/5</label>
            </div>
            <input 
              type="range" 
              min="1" max="5" 
              className="w-full accent-primary"
              value={selfRating}
              onChange={e => setSelfRating(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Beginner (1)</span>
              <span>Expert (5)</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-zinc-200 :bg-zinc-700 rounded-md transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isPending || (!rating && !skillId)}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StarIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
