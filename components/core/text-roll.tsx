'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TextRollProps {
    children: string;
    className?: string;
    delay?: number;
}

export function TextRoll({ children, className, delay = 0 }: TextRollProps) {
    const letters = children.split('');

    return (
        <div className={cn('inline-flex overflow-hidden', className)}>
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                        duration: 0.5,
                        delay: delay + index * 0.03,
                        ease: [0.33, 1, 0.68, 1],
                    }}
                    className='inline-block'
                >
                    {letter === ' ' ? '\u00A0' : letter}
                </motion.span>
            ))}
        </div>
    );
}
