'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ScaleInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export function ScaleIn({ children, className, delay = 0 }: ScaleInProps) {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.33, 1, 0.68, 1],
            }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
