
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Gift, Loader2 } from 'lucide-react';
import type { Reward as BusinessRewardType } from '@/types/business';
import { useAuth } from '@/contexts/AuthContext';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';

const renderIcon = (iconName?: string) => {
  if (!iconName) return <Gift className="h-7 w-7 text-primary" />;
  const IconComponent = (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)];
  if (IconComponent) {
    return <IconComponent className="h-7 w-7 text-primary" />;
  }
  return <Gift className="h-7 w-7 text-primary" />; // Fallback
};

interface RewardCardProps {
  reward: BusinessRewardType;
  businessId: string;
  userPointsInBusiness: number;
  onRewardRedeemed: () => void;
}

export function RewardCard({ reward, businessId, userPointsInBusiness, onRewardRedeemed }: RewardCardProps) {
  const { toast } = useToast();
  const { user, redeemReward } = useAuth();
  const [isRedeeming, setIsRedeeming] = useState(false);

  const canRedeem = userPointsInBusiness >= reward.pointsCost;

  const handleRedeem = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to redeem rewards.", variant: "destructive"});
      return;
    }
    if (!canRedeem) {
      // Button should be disabled, but as a safeguard:
      toast({ title: "Not Enough Points", description: `You need ${reward.pointsCost} points, but have ${userPointsInBusiness}.`, variant: "destructive"});
      return;
    }

    setIsRedeeming(true);
    const success = await redeemReward(user.id, businessId, reward, userPointsInBusiness);
    setIsRedeeming(false);

    if (success) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Reward Redeemed!</span>
          </div>
        ),
        description: `You've successfully redeemed "${reward.title}".`,
        variant: "default" // Green background for success
      });
      onRewardRedeemed(); 
    }
    // redeemReward handles its own error toasts for insufficient points or other failures
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 bg-card">
      <CardHeader className="pb-3">
         <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-primary/10 rounded-full">
             {renderIcon(reward.icon)}
            </div>
            <Badge variant="secondary" className="whitespace-nowrap text-sm font-medium">{reward.category}</Badge>
        </div>
        <CardTitle className="font-headline text-xl h-14 line-clamp-2">{reward.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="min-h-[40px] line-clamp-2 text-sm">{reward.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between pt-4 border-t mt-auto gap-3 sm:gap-2">
        <p className="text-xl font-semibold text-accent">
          {reward.pointsCost} <span className="text-sm font-normal text-muted-foreground">Points</span>
        </p>
        <Button 
          onClick={handleRedeem} 
          disabled={!canRedeem || isRedeeming}
          className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 text-base py-2.5"
        >
          {isRedeeming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redeeming...
            </>
          ) : canRedeem ? "Redeem Reward" : "Not Enough Points"}
        </Button>
      </CardFooter>
    </Card>
  );
}

