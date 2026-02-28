'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/api/manager.api';
import { CheckSquare, Check, X, Edit2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PendingReviewsPage() {
  const queryClient = useQueryClient();
  const [activeReviewModal, setActiveReviewModal] = useState<{ id: string, type: 'EDIT' | 'REJECT', rating: any } | null>(null);

  const { data: pendingReviews, isLoading } = useQuery({
    queryKey: ['manager', 'reviews', 'pending'],
    queryFn: managerApi.getPendingSkillReviews,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => managerApi.reviewSkillRating(id, data),
    onSuccess: () => {
      toast.success('Skill review submitted');
      queryClient.invalidateQueries({ queryKey: ['manager', 'reviews', 'pending'] });
      setActiveReviewModal(null);
    },
    onError: () => toast.error('Failed to submit review')
  });

  const handleApprove = (id: string) => {
    reviewMutation.mutate({ id, data: { action: 'APPROVE', reviewComment: 'Approved as self-rated.' } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Skill Reviews</h1>
          <p className="text-muted-foreground mt-1">Review self-ratings submitted by your team members.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : pendingReviews?.length === 0 ? (
        <div className="text-center p-12 bg-white border rounded-xl shadow-sm border-dashed">
          <CheckSquare className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 ">All caught up!</h3>
          <p className="text-zinc-500 mt-1">There are no pending skill review requests from your team.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingReviews?.map((rating: any) => (
            <div key={rating.id} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col transition hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{rating.employee?.fullname || 'Team Member'}</h3>
                  <p className="text-sm text-zinc-500">{rating.skill?.name}</p>
                </div>
                <div className="bg-blue-100 text-blue-700 font-bold text-xl px-3 py-1 rounded-lg">
                  {rating.selfRating}
                  <span className="text-xs text-blue-400 font-normal">/5</span>
                </div>
              </div>

              <div className="mt-auto pt-4 flex gap-2 border-t border-zinc-100 ">
                <button 
                  onClick={() => handleApprove(rating.id)}
                  disabled={reviewMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 :bg-green-900/40 py-2 rounded-md font-medium text-sm transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button 
                  onClick={() => setActiveReviewModal({ id: rating.id, type: 'EDIT', rating })}
                  disabled={reviewMutation.isPending}
                  className="flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 :bg-blue-900/40 p-2 px-3 rounded-md transition disabled:opacity-50"
                  title="Edit Rating"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveReviewModal({ id: rating.id, type: 'REJECT', rating })}
                  disabled={reviewMutation.isPending}
                  className="flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 :bg-red-900/40 p-2 px-3 rounded-md transition disabled:opacity-50"
                  title="Reject Update"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeReviewModal && (
        <ReviewModal 
          isOpen={!!activeReviewModal}
          type={activeReviewModal.type}
          rating={activeReviewModal.rating}
          onClose={() => setActiveReviewModal(null)}
          onConfirm={(data: unknown) => reviewMutation.mutate({ id: activeReviewModal.id, data })}
          isPending={reviewMutation.isPending}
        />
      )}
    </div>
  );
}

function ReviewModal({ ...props }: any) {
  const { type, rating, onClose, onConfirm, isPending } = props;
  const [approvedRating, setApprovedRating] = useState(rating.selfRating);
  const [reviewComment, setReviewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'EDIT') {
      onConfirm({ action: 'EDIT', approvedRating, reviewComment });
    } else {
      onConfirm({ action: 'REJECT', reviewComment });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${type === 'EDIT' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
            {type === 'EDIT' ? <Edit2 className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-xl font-bold">{type === 'EDIT' ? 'Edit & Approve Rating' : 'Reject Request'}</h2>
            <p className="text-sm text-zinc-500">{rating.employee?.fullname} • {rating.skill?.name}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {type === 'EDIT' && (
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-zinc-500">Self-Rating: {rating.selfRating}/5</span>
                <label className="font-medium">Manager Rating: <span className="text-primary font-bold">{approvedRating}</span></label>
              </div>
              <input 
                type="range" 
                min="1" max="5" 
                className="w-full accent-primary mt-2"
                value={approvedRating}
                onChange={e => setApprovedRating(Number(e.target.value))}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Feedback Comment {type === 'REJECT' && <span className="text-red-500">*</span>}
            </label>
            <textarea 
              required={type === 'REJECT'}
              className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none border-zinc-200 h-24 resize-none"
              placeholder={type === 'REJECT' ? "Please explain why this rating relies is rejected..." : "Provide constructive feedback..."}
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
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
              disabled={isPending || (type === 'REJECT' && !reviewComment.trim())}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition disabled:opacity-50 flex items-center gap-2 ${type === 'EDIT' ? 'bg-primary hover:bg-primary/90' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isPending ? 'Processing...' : type === 'EDIT' ? 'Approve Update' : 'Reject Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
