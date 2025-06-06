
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Gift, History, Sparkles, Users, BarChart3, Briefcase, ShoppingCart, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-12 bg-card rounded-lg shadow-lg">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
          Welcome to Loyalty Leap!
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
          Elevate your customer relationships and reward loyalty. Loyalty Leap is your all-in-one platform for digital loyalty programs, personalized rewards, and insightful analytics.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/signup">Get Started for Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Access Your Account</Link>
          </Button>
        </div>
      </section>

      <section className="py-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-headline font-semibold text-foreground mb-2">Transforming Loyalty for Everyone</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover how Loyalty Leap benefits both customers and businesses.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-headline font-semibold text-primary flex items-center gap-2">
              <Users className="h-7 w-7" /> For Our Valued Customers
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Say goodbye to paper punch cards and hello to seamless digital rewards! With Loyalty Leap, you can:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><CreditCard className="inline-block h-5 w-5 mr-2 text-green-500" /> Effortlessly collect points from all your favorite enrolled businesses.</li>
              <li><Gift className="inline-block h-5 w-5 mr-2 text-green-500" /> Browse and redeem a wide variety of exciting rewards directly in the app.</li>
              <li><History className="inline-block h-5 w-5 mr-2 text-green-500" /> Keep track of all your purchases, points earned, and redemptions in one place.</li>
              <li><Sparkles className="inline-block h-5 w-5 mr-2 text-green-500" /> Receive personalized offers and recommendations tailored to your preferences.</li>
            </ul>
             <Button variant="secondary" asChild>
                <Link href="/loyalty">Explore Your Loyalty Hub <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-lg overflow-hidden shadow-xl">
            <Image 
              src="https://placehold.co/600x450.png" 
              alt="Customer using Loyalty Leap app" 
              width={600} 
              height={450} 
              className="object-cover w-full h-full"
              data-ai-hint="mobile app user" 
            />
          </div>
        </div>
      </section>

      <section className="py-10 bg-card rounded-lg shadow-lg">
        <div className="grid md:grid-cols-2 gap-10 items-center container mx-auto px-4">
           <div className="rounded-lg overflow-hidden shadow-xl md:order-1">
            <Image 
              src="https://placehold.co/600x450.png" 
              alt="Business dashboard on Loyalty Leap" 
              width={600} 
              height={450} 
              className="object-cover w-full h-full"
              data-ai-hint="business dashboard computer"
            />
          </div>
          <div className="space-y-6 md:order-2">
            <h3 className="text-2xl font-headline font-semibold text-primary flex items-center gap-2">
              <Briefcase className="h-7 w-7" /> For Forward-Thinking Businesses
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Build stronger customer relationships and drive growth with our powerful loyalty platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><BarChart3 className="inline-block h-5 w-5 mr-2 text-green-500" /> Create and manage customizable digital loyalty programs with ease.</li>
              <li><ShoppingCart className="inline-block h-5 w-5 mr-2 text-green-500" /> Identify your customers and record their purchases to award points seamlessly.</li>
              <li><Users className="inline-block h-5 w-5 mr-2 text-green-500" /> Access a dashboard to view enrolled users and their engagement.</li>
              <li><Sparkles className="inline-block h-5 w-5 mr-2 text-green-500" /> Gain insights to understand customer behavior and refine your offerings.</li>
            </ul>
            <Button variant="secondary" asChild>
                <Link href="/admin/login">Access Business Portal <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="text-center py-12">
        <h2 className="text-3xl font-headline font-semibold text-foreground mb-4">Ready to Leap into Loyalty?</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Join thousands of users and businesses already benefiting from a smarter way to manage loyalty.
        </p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/signup">Sign Up Today &rarr;</Link>
        </Button>
      </section>
    </div>
  );
}
