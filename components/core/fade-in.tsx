'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface FadeInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export function FadeIn({
    children,
    className,
    delay = 0,
    direction = 'up'
}: FadeInProps) {
    const directionOffset = {
        up: { y: 24 },
        down: { y: -24 },
        left: { x: 24 },
        right: { x: -24 },
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directionOffset[direction]
            }}
            animate={{
                opacity: 1,
                x: 0,
                y: 0
            }}
            transition={{
                duration: 0.6,
                delay,
                ease: [0.33, 1, 0.68, 1],
            }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
