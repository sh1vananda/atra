
"use client";

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Edit3 } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import type { Reward } from '@/types/business';

// Schema without image and imageHint
const rewardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  pointsCost: z.coerce.number().int().min(1, "Points cost must be at least 1"),
  category: z.string().min(2, "Category is required"),
  icon: z.string().optional(), // Optional Lucide icon name
});

type RewardFormData = z.infer<typeof rewardSchema>;

interface EditRewardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  rewardToEdit: Reward;
  onRewardUpdated: () => void;
}

export function EditRewardDialog({ isOpen, onOpenChange, businessId, rewardToEdit, onRewardUpdated }: EditRewardDialogProps) {
  const { updateRewardInBusiness } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      title: rewardToEdit.title,
      description: rewardToEdit.description,
      pointsCost: rewardToEdit.pointsCost,
      category: rewardToEdit.category,
      icon: rewardToEdit.icon || '',
    }
  });

  useEffect(() => {
    if (rewardToEdit) {
      reset({
        title: rewardToEdit.title,
        description: rewardToEdit.description,
        pointsCost: rewardToEdit.pointsCost,
        category: rewardToEdit.category,
        icon: rewardToEdit.icon || '',
      });
    }
  }, [rewardToEdit, reset]);

  const onSubmit: SubmitHandler<RewardFormData> = async (data) => {
    setIsLoading(true);
    const fullUpdatedReward: Reward = {
        ...rewardToEdit, 
        ...data,
        icon: data.icon || '', // Ensure icon is an empty string if not provided
    };
    const success = await updateRewardInBusiness(businessId, fullUpdatedReward);
    setIsLoading(false);
    if (success) {
      onRewardUpdated();
      onOpenChange(false); // Close dialog on success
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) reset(); 
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" />
            Edit Reward
          </DialogTitle>
          <DialogDescription>
            Update the details for "{rewardToEdit.title}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Reward Title</Label>
            <Input id="title" {...register("title")} placeholder="e.g., Free Coffee" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Describe the reward" rows={3}/>
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pointsCost">Points Cost</Label>
              <Input id="pointsCost" type="number" {...register("pointsCost")} />
              {errors.pointsCost && <p className="text-sm text-destructive mt-1">{errors.pointsCost.message}</p>}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register("category")} placeholder="e.g., Beverage, Discount"/>
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="icon">Icon Name (Optional)</Label>
            <Input id="icon" {...register("icon")} placeholder="e.g., Coffee, Gift (from Lucide)" />
            {errors.icon && <p className="text-sm text-destructive mt-1">{errors.icon.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
