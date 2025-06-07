
"use client";

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, UserMembership } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

const appealSchema = z.object({
  businessId: z.string().min(1, "Please select a business."),
  item: z.string().min(1, "Item name is required (e.g., Coffee, Sandwich)."),
  amount: z.coerce.number().min(0.01, "Amount must be a positive value."),
  pointsExpected: z.coerce.number().int("Points must be a whole number.").min(1, "Points expected must be at least 1."),
  appealReason: z.string().min(10, "Please provide a brief reason for this appeal (min 10 characters).").max(300, "Reason too long (max 300 characters)."),
});

type AppealFormData = z.infer<typeof appealSchema>;

interface AddPastPurchaseDialogProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // onPurchaseAdded is no longer needed as this submits an appeal, not an immediate purchase
}

export function AddPastPurchaseDialog({ user, isOpen, onOpenChange }: AddPastPurchaseDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { submitPurchaseAppeal } = useAuth();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AppealFormData>({
    resolver: zodResolver(appealSchema),
    defaultValues: {
      businessId: user.memberships && user.memberships.length > 0 ? user.memberships[0].businessId : '',
      item: '',
      amount: undefined,
      pointsExpected: undefined,
      appealReason: '',
    }
  });

  const onSubmit: SubmitHandler<AppealFormData> = async (data) => {
    startTransition(async () => {
      const selectedMembership = user.memberships?.find(m => m.businessId === data.businessId);
      if (!selectedMembership) {
        toast({ title: "Error", description: "Selected business membership not found.", variant: "destructive" });
        return;
      }

      try {
        const success = await submitPurchaseAppeal({
          ...data,
          businessName: selectedMembership.businessName, // Pass business name
        });

        if (success) {
          toast({
            title: "Appeal Submitted",
            description: `Your request for ${data.item} has been submitted for review.`,
            variant: 'default',
          });
          reset({
            businessId: user.memberships && user.memberships.length > 0 ? user.memberships[0].businessId : '',
            item: '',
            amount: undefined,
            pointsExpected: undefined,
            appealReason: '',
          });
          onOpenChange(false);
        } else {
          // submitPurchaseAppeal should handle its own error toasts if it returns false
        }
      } catch (e) {
        toast({
          title: "Submission Error",
          description: e instanceof Error ? e.message : "Could not submit appeal.",
          variant: "destructive",
        });
      }
    });
  };
  
  const userMemberships = user.memberships || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        reset({ 
            businessId: userMemberships.length > 0 ? userMemberships[0].businessId : '', 
            item: '', 
            amount: undefined, 
            pointsExpected: undefined,
            appealReason: '',
          });
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Submit Purchase Appeal
          </DialogTitle>
          <DialogDescription>
            Enter details of a past purchase to request points. This will be reviewed by the business.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="businessId">Business</Label>
            <Controller
                name="businessId"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <SelectTrigger id="businessId" className="w-full mt-1">
                            <SelectValue placeholder="Select a business" />
                        </SelectTrigger>
                        <SelectContent>
                            {userMemberships.length > 0 ? (
                                userMemberships.map((membership: UserMembership) => (
                                <SelectItem key={membership.businessId} value={membership.businessId}>
                                    {membership.businessName}
                                </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="nobusiness" disabled>No businesses joined</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.businessId && <p className="text-sm text-destructive mt-1">{errors.businessId.message}</p>}
          </div>

          <div>
            <Label htmlFor="item">Item Name / Description</Label>
            <Input id="item" {...register("item")} placeholder="e.g., Large Latte, Birthday Dinner" className="mt-1" />
            {errors.item && <p className="text-sm text-destructive mt-1">{errors.item.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} placeholder="e.g., 5.99" className="mt-1" />
              {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <Label htmlFor="pointsExpected">Points Expected</Label>
              <Input id="pointsExpected" type="number" step="1" {...register("pointsExpected")} placeholder="e.g., 10" className="mt-1" />
              {errors.pointsExpected && <p className="text-sm text-destructive mt-1">{errors.pointsExpected.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="appealReason">Reason for Appeal</Label>
            <Textarea 
              id="appealReason" 
              {...register("appealReason")} 
              placeholder="e.g., Forgot to scan my QR code during checkout." 
              className="mt-1"
              rows={3}
            />
            {errors.appealReason && <p className="text-sm text-destructive mt-1">{errors.appealReason.message}</p>}
          </div>
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || userMemberships.length === 0} className="bg-primary hover:bg-primary/90">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Appeal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
