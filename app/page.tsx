// @ts-nocheck

"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, FileText, Shield, Zap } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AnalyticsService from '@/lib/analyticsService';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    const analyticsService = new AnalyticsService();
    
    const fetchUserCount = async () => {
      // Get the trusted by count from our analytics service
      const count = await analyticsService.getTrustedByCount();
      setUserCount(count);
    };

    fetchUserCount();

    // Still listen for realtime updates
    const subscription = supabase
      .channel('public:sessions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, payload => {
        setUserCount(prevCount => prevCount + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background pt-8">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:40px_40px] [mask-image:radial-gradient(white,transparent_70%)]" />
        <div className="container relative z-10 mx-auto flex flex-col items-center justify-center gap-4 py-20 text-center md:py-24">
          <div className="absolute left-4 top-4 rounded-br-3xl bg-primary px-4 py-2 md:left-8 md:top-8">
            <p className="text-sm font-medium text-primary-foreground">
              Trusted by <span className="font-bold">{userCount}+</span> Kenyans
            </p>
          </div>
          <div className="absolute top-4 right-4 animate-bounce duration-5000 md:top-8 md:right-8">
            <div className="relative h-[180px] w-[180px]">
              <Image
                src="/simple-logo - with-text.png"
                alt="Kenya Revenue Authority (KRA) logo"
                width={350  }
                height={350 }
                className="object-contain rounded-2xl"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Effortless KRA Nil Returns
              <br />
              <span className="text-primary">In Just 30 Seconds</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              Nunge Returns simplifies tax compliance for students and unemployed youth. 
              Fast, secure, and affordable - your path to hassle-free filing starts here.
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row">
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/file">
                Start Filing Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full">
              Explore Features
            </Button>
          </div>
        </div>
      </section>

      <section className=" space-y-8 py-4 px-6 md:px-0 mb-8">
        <div className="mx-auto flex max-w-[48rem] flex-col items-center space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">
            Everything You Need for Seamless Filing
          </h2>
          <p className="max-w-[500px] text-muted-foreground md:text-lg">
            Our platform is designed with you in mind, offering a suite of features to make your tax filing experience smooth and worry-free.
          </p>
        </div>
        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg border bg-background p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="mt-2 text-lg font-bold">Lightning-Fast Filing</h3>
            <p className="mt-1 text-muted-foreground">Complete your nil returns in seconds with our automated, user-friendly system.</p>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <h3 className="mt-2 text-lg font-bold">Bank-Grade Security</h3>
            <p className="mt-1 text-muted-foreground">Rest easy knowing your data is protected with state-of-the-art encryption and security measures.</p>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="mt-2 text-lg font-bold">Instant Documentation</h3>
            <p className="mt-1 text-muted-foreground">Receive your filing receipts and confirmations immediately after submission.</p>
          </div>
        </div>
        <div className="mx-auto flex flex-col items-center space-y-4 text-center">
          <Button size="lg" className="rounded-full" asChild>
            <Link href="/file">
              Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* <section className="bg-primary/5 px-24 py-8">
        <div className=" flex flex-col items-center justify-between gap-8 px-4 md:flex-row md:px-0">
          <div className="max-w-md space-y-4 md:space-y-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Simplify Your Tax Returns?
            </h2>
            <p className="text-muted-foreground md:text-xl">
              Join thousands of satisfied Kenyans who have made tax compliance a breeze with Nunge Returns.
            </p>
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/file">
                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="relative h-[250px] w-[250px] md:h-[300px] md:w-[300px]">
            <Image
              src="/kra-logo.png"
              alt="Kenya Revenue Authority (KRA) logo"
              width={300}
              height={300}
              className="object-contain"
            />
          </div>
        </div>
      </section> */}
    </>
  )
}
