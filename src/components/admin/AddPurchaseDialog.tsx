
"use client";

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext'; // Assuming addMockPurchaseToUser is here

const purchaseSchema = z.object({
  item: z.string().min(1, "Item name is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  pointsEarned: z.coerce.number().int("Points must be a whole number"),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface AddPurchaseDialogProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseAdded: () => void; // Callback to refresh user list or details
}

export function AddPurchaseDialog({ user, isOpen, onOpenChange, onPurchaseAdded }: AddPurchaseDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { addMockPurchaseToUser } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      item: '',
      amount: 0,
      pointsEarned: 0,
    }
  });

  const onSubmit: SubmitHandler<PurchaseFormData> = async (data) => {
    startTransition(async () => {
      try {
        const success = await addMockPurchaseToUser(user.id, {
          item: data.item,
          amount: data.amount,
          pointsEarned: data.pointsEarned,
        });

        if (success) {
          toast({
            title: "Purchase Added",
            description: `Successfully added purchase for ${user.name}.`,
            variant: 'default',
          });
          reset();
          onPurchaseAdded(); // Notify parent to refresh data
          onOpenChange(false); // Close dialog
        } else {
          throw new Error("Failed to add purchase via context.");
        }
      } catch (e) {
        console.error("Error adding purchase:", e);
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Could not add purchase.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) reset(); // Reset form if dialog is closed
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
            Add Purchase for {user.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="item">Item Name</Label>
            <Input id="item" {...register("item")} placeholder="e.g., Coffee, Sandwich" />
            {errors.item && <p className="text-sm text-destructive mt-1">{errors.item.message}</p>}
          </div>
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} placeholder="e.g., 5.99" />
            {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="pointsEarned">Points Earned</Label>
            <Input id="pointsEarned" type="number" step="1" {...register("pointsEarned")} placeholder="e.g., 20" />
            {errors.pointsEarned && <p className="text-sm text-destructive mt-1">{errors.pointsEarned.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Purchase"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
