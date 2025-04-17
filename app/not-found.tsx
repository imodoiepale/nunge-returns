"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 animate-fadeIn">
      <div className="w-full max-w-md mx-auto text-center">
        {/* Error Code */}
        <h1 className="text-8xl font-bold text-primary mb-2">404</h1>
        
        {/* Error Image - Using SVG placeholder, replace with GIF when available */}
        <div className="relative w-64 h-64 mx-auto my-6">
          <Image 
            src="/images/404-placeholder.svg" 
            alt="Page not found" 
            width={256}
            height={256}
            className="object-contain"
            priority
          />
        </div>
        
        {/* Error Message */}
        <h2 className="text-2xl font-semibold mb-2">Oops! Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="default" 
            size="lg" 
            className="w-full sm:w-auto"
            asChild
          >
            <Link href="/">
              <Home />
              <span>Home</span>
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto"
            asChild
          >
            <Link href="/file">
              <FileText />
              <span>File Returns</span>
            </Link>
          </Button>
          
          <Button 
            variant="secondary" 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft />
            <span>Go Back</span>
          </Button>
        </div>
        
        {/* Help Link */}
        <div className="mt-8">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary"
            asChild
          >
            <Link href="/contact">
              <HelpCircle className="mr-1 h-4 w-4" />
              <span>Need help? Contact support</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
