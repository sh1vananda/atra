
"use client";

import type { ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Gift } from 'lucide-react'; // Using Gift as a default
import type { Reward as BusinessRewardType } from '@/types/business'; // Aliasing to avoid conflict
import { useAuth } from '@/contexts/AuthContext';
import * as LucideIcons from 'lucide-react';

// Helper to render Lucide icon by name
const renderIcon = (iconName?: string) => {
  if (!iconName) return <Gift className="h-6 w-6 text-primary" />; // Default icon
  const IconComponent = (LucideIcons as any)[iconName];
  if (IconComponent) {
    return <IconComponent className="h-6 w-6 text-primary" />;
  }
  return <Gift className="h-6 w-6 text-primary" />; // Fallback if icon name is invalid
};

interface RewardCardProps {
  reward: BusinessRewardType;
  businessId: string;
  userPointsInBusiness: number;
  onRewardRedeemed: () => void; // Callback after redemption
}

export function RewardCard({ reward, businessId, userPointsInBusiness, onRewardRedeemed }: RewardCardProps) {
  const { toast } = useToast();
  const { user, redeemReward } = useAuth(); // Get redeemReward function and user

  const canRedeem = userPointsInBusiness >= reward.pointsCost;

  const handleRedeem = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to redeem rewards.", variant: "destructive"});
      return;
    }
    if (!canRedeem) {
      toast({ title: "Not Enough Points", description: `You need ${reward.pointsCost} points, but only have ${userPointsInBusiness}.`, variant: "destructive"});
      return;
    }

    const success = await redeemReward(user.id, businessId, reward, userPointsInBusiness);
    if (success) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Reward Redeemed!</span>
          </div>
        ),
        description: `You've successfully redeemed "${reward.title}" for ${reward.pointsCost} points.`,
      });
      onRewardRedeemed(); // Call callback to allow parent to refresh if needed
    }
    // redeemReward already handles its own error toasts
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 bg-card">
      <CardHeader className="pb-3">
         <div className="flex items-center justify-between mb-3">
            {renderIcon(reward.icon)}
            <Badge variant="secondary" className="whitespace-nowrap">{reward.category}</Badge>
        </div>
        <CardTitle className="font-headline text-xl">{reward.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="min-h-[40px] line-clamp-2">{reward.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t mt-auto">
        <p className="text-lg font-semibold text-accent mb-2 sm:mb-0">
          {reward.pointsCost} <span className="text-sm font-normal text-muted-foreground">Points</span>
        </p>
        <Button 
          onClick={handleRedeem} 
          disabled={!canRedeem}
          className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {canRedeem ? "Redeem Reward" : "Not Enough Points"}
        </Button>
      </CardFooter>
    </Card>
  );
}
