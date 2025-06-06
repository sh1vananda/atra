"use client";

import Image from 'next/image';
import type { ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  icon: ReactNode;
  image: string;
  imageHint: string;
  category: string;
}

interface RewardCardProps {
  reward: Reward;
}

export function RewardCard({ reward }: RewardCardProps) {
  const { toast } = useToast();

  const handleRedeem = () => {
    // Mock redemption
    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span>Reward Redeemed!</span>
        </div>
      ),
      description: `You've successfully redeemed "${reward.title}" for ${reward.pointsCost} points.`,
      variant: 'default', 
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader className="pb-2">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-md mb-4">
          <Image 
            src={reward.image} 
            alt={reward.title} 
            width={400} 
            height={300} 
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={reward.imageHint}
          />
        </div>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-xl">{reward.title}</CardTitle>
          {reward.icon}
        </div>
        <Badge variant="secondary" className="w-fit mt-1">{reward.category}</Badge>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{reward.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t mt-auto">
        <p className="text-lg font-semibold text-accent mb-2 sm:mb-0">
          {reward.pointsCost} <span className="text-sm font-normal">Points</span>
        </p>
        <Button 
          onClick={handleRedeem} 
          className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Redeem Reward
        </Button>
      </CardFooter>
    </Card>
  );
}
