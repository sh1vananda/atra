import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Edit3, Star } from 'lucide-react';
import Image from 'next/image';

export default function LoyaltyPage() {
  // Mock data
  const currentPoints = 280;
  const pointsToNextReward = 500;
  const progress = (currentPoints / pointsToNextReward) * 100;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
            Your Loyalty Status
          </CardTitle>
          <CardDescription>Track your points and progress towards new rewards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary">{currentPoints}</p>
            <p className="text-muted-foreground">Points</p>
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progress to next reward tier</span>
              <span>{currentPoints} / {pointsToNextReward}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="bg-accent h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
             <p className="text-xs text-muted-foreground mt-1 text-center">You are {pointsToNextReward - currentPoints} points away from your next reward!</p>
          </div>

          <div className="aspect-[16/10] w-full max-w-md mx-auto bg-gradient-to-br from-primary to-blue-700 rounded-xl shadow-2xl p-6 flex flex-col justify-between text-primary-foreground">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold font-headline">Loyalty Leap Card</h3>
                <Star className="h-10 w-10 text-yellow-300 fill-yellow-300 opacity-50" />
              </div>
              <p className="text-sm opacity-80">Member ID: LL-12345678</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{currentPoints} PTS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Earn More Points</CardTitle>
          <CardDescription>Use QR code at checkout or enter a code manually.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 p-6 border rounded-lg bg-secondary/30 text-center">
            <QrCode className="h-16 w-16 mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Scan QR Code</h3>
            <p className="text-muted-foreground">Present this QR code at checkout to earn points.</p>
            <div className="bg-white p-2 rounded-md inline-block shadow-md">
              <Image src="https://placehold.co/150x150.png?text=SCAN+ME" alt="QR Code Placeholder" width={150} height={150} data-ai-hint="QR code" />
            </div>
            <Button className="w-full mt-2" variant="outline">
              Show My QR Code
            </Button>
          </div>
          <div className="space-y-4 p-6 border rounded-lg bg-secondary/30">
            <Edit3 className="h-12 w-12 mx-auto text-primary md:mx-0" />
            <h3 className="text-xl font-semibold">Enter Code Manually</h3>
            <div className="space-y-2">
              <Label htmlFor="manual-code">Enter your purchase code:</Label>
              <Input id="manual-code" placeholder="e.g., XYZ123ABC" />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90">Submit Code</Button>
            <p className="text-xs text-muted-foreground text-center">Code can be found on your receipt.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
