
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import type { Reward } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

const rewardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  pointsCost: z.coerce.number().int().min(1, "Points cost must be at least 1"),
  category: z.string().min(2, "Category is required"),
  image: z.string().url("Must be a valid URL (e.g., https://placehold.co/400x225.png)").or(z.literal('')).optional(),
  imageHint: z.string().optional(),
});

type RewardFormData = z.infer<typeof rewardSchema>;

interface AddRewardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onRewardAdded: () => void;
}

export function AddRewardDialog({ isOpen, onOpenChange, businessId, onRewardAdded }: AddRewardDialogProps) {
  const { addRewardToBusiness } = useAdminAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      title: '',
      description: '',
      pointsCost: 0,
      category: '',
      image: '',
      imageHint: '',
    }
  });

  const onSubmit: SubmitHandler<RewardFormData> = async (data) => {
    setIsLoading(true);
    const rewardPayload: Omit<Reward, 'id'> = {
      ...data,
      image: data.image || `https://placehold.co/400x225.png?text=${encodeURIComponent(data.title)}`, // Default placeholder if empty
      imageHint: data.imageHint || data.title.toLowerCase().split(' ').slice(0,2).join(' '), // Default hint
      icon: undefined, // icon is optional in type, not set from this form
    };
    const success = await addRewardToBusiness(businessId, rewardPayload);
    setIsLoading(false);
    if (success) {
      onRewardAdded(); 
      reset(); 
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
            <PlusCircle className="mr-2 h-5 w-5 text-primary" />
            Add New Reward
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the new reward you want to offer.
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
            <Label htmlFor="image">Image URL (Optional)</Label>
            <Input id="image" {...register("image")} placeholder="https://placehold.co/400x225.png" />
            {errors.image && <p className="text-sm text-destructive mt-1">{errors.image.message}</p>}
          </div>

           <div>
            <Label htmlFor="imageHint">Image AI Hint (Optional)</Label>
            <Input id="imageHint" {...register("imageHint")} placeholder="e.g., coffee cup" />
            {errors.imageHint && <p className="text-sm text-destructive mt-1">{errors.imageHint.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Reward"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
