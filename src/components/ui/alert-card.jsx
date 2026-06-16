import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25, staggerChildren: 0.1 }
  },
  exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const VARIANTS = {
  danger: { bg: "#FF5C5C", color: "white" },
  success: { bg: "#10b981", color: "white" },
  info: { bg: "#3b82f6", color: "white" },
};

const AlertCard = React.forwardRef(({
  className, icon, title, description, buttonText,
  onButtonClick, isVisible, onDismiss, variant = "danger", noDismiss, ...props
}, ref) => {
  const style = VARIANTS[variant] || VARIANTS.danger;
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={ref}
          className={cn(
            "relative w-full overflow-hidden rounded-2xl p-6 shadow-2xl",
            className
          )}
          style={{ background: style.bg, color: style.color }}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="alert"
          aria-live="assertive"
          {...props}
        >
          {onDismiss && !noDismiss && (
            <motion.div variants={itemVariants} className="absolute top-3 right-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/20" onClick={onDismiss}>
                <X className="h-4 w-4 text-white" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </motion.div>
          )}

          {icon && (
            <motion.div variants={itemVariants}
              className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                {icon}
              </motion.div>
            </motion.div>
          )}

          <motion.h3 variants={itemVariants} className="text-2xl font-bold tracking-tight">
            {title}
          </motion.h3>

          <motion.p variants={itemVariants} className="mt-2 text-sm text-white/80 max-w-[80%]">
            {description}
          </motion.p>

          <motion.div variants={itemVariants} className="mt-6">
            <Button
              className="w-full rounded-full bg-black py-6 text-base font-semibold text-white shadow-lg transition-transform duration-200 hover:bg-black/85 active:scale-95"
              onClick={onButtonClick}
            >
              {buttonText}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

AlertCard.displayName = "AlertCard";

export { AlertCard };