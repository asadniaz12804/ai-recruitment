import React from 'react';
import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            className,
            padding = 'md',
            interactive = false,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    styles.card,
                    styles[padding],
                    interactive && styles.interactive,
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
