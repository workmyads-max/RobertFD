import React from 'react';
import { cn } from '@/lib/utils';

const Card = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const Header = ({ children, className, glassEffect = false, ...props }) => {
  return (
    <div 
      className={cn(
        "p-6",
        glassEffect && "bg-gradient-to-b from-white/5 to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const Body = ({ children, className, ...props }) => {
  return (
    <div className={cn("p-6 pt-2", className)} {...props}>
      {children}
    </div>
  );
};

const Description = ({ children, className, ...props }) => {
  return (
    <p 
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
};

const List = ({ children, className, ...props }) => {
  return (
    <ul 
      className={cn("space-y-3", className)}
      {...props}
    >
      {children}
    </ul>
  );
};

const ListItem = ({ children, className, ...props }) => {
  return (
    <li 
      className={cn(
        "flex items-center gap-3",
        className
      )}
      {...props}
    >
      {children}
    </li>
  );
};

export { Card, Header, Body, Description, List, ListItem };
export default { Card, Header, Body, Description, List, ListItem };