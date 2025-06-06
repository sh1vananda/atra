
"use client";

import type { Business, Reward } from '@/types/business';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit3, Trash2, Gift, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { AddRewardDialog } from './AddRewardDialog';
import { EditRewardDialog } from './EditRewardDialog';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface ManageRewardsSectionProps {
  business: Business | null;
  onRewardChange: () => void; 
}

export function ManageRewardsSection({ business, onRewardChange }: ManageRewardsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [rewardToEdit, setRewardToEdit] = useState<Reward | null>(null);
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const { deleteRewardFromBusiness } = useAdminAuth();
  const { toast } = useToast();

  const handleOpenEditDialog = (reward: Reward) => {
    setRewardToEdit(reward);
    setIsEditDialogOpen(true);
  };

  const handleDeleteReward = async () => {
    if (!business || !rewardToDelete) return;
    const success = await deleteRewardFromBusiness(business.id, rewardToDelete.id);
    if (success) {
      onRewardChange(); 
      toast({ title: "Reward Deleted", description: `Successfully deleted "${rewardToDelete.title}".` });
    } else {
      toast({ title: "Deletion Failed", description: `Could not delete "${rewardToDelete.title}".`, variant: "destructive" });
    }
    setRewardToDelete(null); 
  };

  if (!business) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Manage Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading business data or no business managed.</p>
        </CardContent>
      </Card>
    );
  }

  const rewards = business.rewards || [];

  return (
    <>
      <Card className="mt-6 shadow-lg bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Manage Rewards for {business.name}</CardTitle>
            <CardDescription>Add, edit, or remove rewards available to your customers.</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Reward
          </Button>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-10">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No rewards created yet.</p>
              <p className="text-sm text-muted-foreground">Click "Add New Reward" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <Card key={reward.id} className="flex flex-col">
                  <CardHeader>
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-md mb-3 bg-muted">
                      <Image
                        src={reward.image || `https://placehold.co/400x225.png?text=${encodeURIComponent(reward.title)}`}
                        alt={reward.title}
                        width={400}
                        height={225}
                        className="object-cover w-full h-full"
                        data-ai-hint={reward.imageHint || reward.title.toLowerCase().split(' ').slice(0,2).join(' ')}
                      />
                    </div>
                    <CardTitle className="font-headline text-lg">{reward.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Category: {reward.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{reward.description}</p>
                    <p className="font-semibold text-primary">{reward.pointsCost} Points</p>
                  </CardContent>
                  <CardFooter className="border-t pt-4 mt-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(reward)} className="flex-1">
                      <Edit3 className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => setRewardToDelete(reward)} className="flex-1">
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      {rewardToDelete && rewardToDelete.id === reward.id && (
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertTriangle className="h-5 w-5 mr-2 text-destructive"/>
                              Confirm Deletion
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the reward "{rewardToDelete.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRewardToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteReward}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Delete Reward
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isAddDialogOpen && business && (
        <AddRewardDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          businessId={business.id}
          onRewardAdded={() => {
            setIsAddDialogOpen(false);
            onRewardChange();
          }}
        />
      )}
      {isEditDialogOpen && business && rewardToEdit && (
        <EditRewardDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            businessId={business.id}
            rewardToEdit={rewardToEdit}
            onRewardUpdated={() => {
                setIsEditDialogOpen(false);
                setRewardToEdit(null);
                onRewardChange(); 
            }}
        />
      )}
    </>
  );
}
