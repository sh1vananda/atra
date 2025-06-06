
"use client";

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form'; // Added Controller here
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, UserMembership } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

const purchaseSchema = z.object({
  businessId: z.string().min(1, "Please select a business."),
  item: z.string().min(1, "Item name is required (e.g., Coffee, Sandwich)."),
  amount: z.coerce.number().min(0.01, "Amount must be a positive value."),
  pointsEarned: z.coerce.number().int("Points must be a whole number.").min(0, "Points cannot be negative."),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface AddPastPurchaseDialogProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseAdded: () => void;
}

export function AddPastPurchaseDialog({ user, isOpen, onOpenChange, onPurchaseAdded }: AddPastPurchaseDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { addMockPurchaseToUser } = useAuth();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      businessId: user.memberships && user.memberships.length > 0 ? user.memberships[0].businessId : '',
      item: '',
      amount: undefined, // Use undefined for react-hook-form with zod numbers
      pointsEarned: undefined,
    }
  });

  const onSubmit: SubmitHandler<PurchaseFormData> = async (data) => {
    startTransition(async () => {
      try {
        const success = await addMockPurchaseToUser(user.id, data.businessId, {
          item: data.item,
          amount: data.amount,
          pointsEarned: data.pointsEarned,
        });

        if (success) {
          toast({
            title: "Past Purchase Logged",
            description: `Successfully logged purchase for ${data.item}.`,
            variant: 'default',
          });
          reset({ 
            businessId: user.memberships && user.memberships.length > 0 ? user.memberships[0].businessId : '', 
            item: '', 
            amount: undefined, 
            pointsEarned: undefined 
          });
          onPurchaseAdded();
          onOpenChange(false);
        } else {
          throw new Error("Failed to log purchase. Please try again.");
        }
      } catch (e) {
        
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Could not log purchase.",
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
            pointsEarned: undefined 
          });
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5 text-primary" />
            Log a Past Purchase
          </DialogTitle>
          <DialogDescription>
            Enter details from a past purchase for one of your enrolled businesses.
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
              <Label htmlFor="pointsEarned">Points Claimed</Label>
              <Input id="pointsEarned" type="number" step="1" {...register("pointsEarned")} placeholder="e.g., 10" className="mt-1" />
              {errors.pointsEarned && <p className="text-sm text-destructive mt-1">{errors.pointsEarned.message}</p>}
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || userMemberships.length === 0} className="bg-primary hover:bg-primary/90">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log Purchase"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
