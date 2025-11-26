import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotificationProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

// Blob SVG patterns for decorative background
const BlobPattern = ({ color }: { color: string }) => (
  <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
    <div 
      className="absolute w-24 h-24 rounded-full blur-2xl"
      style={{ 
        background: color,
        top: '-10%',
        left: '-10%',
      }}
    />
    <div 
      className="absolute w-16 h-16 rounded-full blur-xl"
      style={{ 
        background: color,
        bottom: '20%',
        right: '10%',
      }}
    />
    <div 
      className="absolute w-12 h-12 rounded-full blur-lg"
      style={{ 
        background: color,
        top: '50%',
        left: '30%',
      }}
    />
  </div>
);

export const ToastNotification = React.forwardRef<HTMLDivElement, ToastNotificationProps>(
  ({ id, message, type, onClose }, ref) => {
    const config = {
      success: {
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        icon: <CheckCircle2 className="w-6 h-6" />,
        iconBg: 'rgba(255, 255, 255, 0.3)',
        textColor: 'text-white',
        blobColor: '#34d399',
      },
      error: {
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        icon: <X className="w-6 h-6" />,
        iconBg: 'rgba(255, 255, 255, 0.3)',
        textColor: 'text-white',
        blobColor: '#f472b6',
      },
      warning: {
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        icon: <AlertCircle className="w-6 h-6" />,
        iconBg: 'rgba(255, 255, 255, 0.3)',
        textColor: 'text-white',
        blobColor: '#fbbf24',
      },
      info: {
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        icon: <Info className="w-6 h-6" />,
        iconBg: 'rgba(255, 255, 255, 0.3)',
        textColor: 'text-white',
        blobColor: '#60a5fa',
      },
    };

    const style = config[type];

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
          opacity: { duration: 0.2 },
        }}
        className="relative w-full rounded-2xl overflow-hidden shadow-lg"
        style={{
          background: style.gradient,
        }}
      >
        <BlobPattern color={style.blobColor} />
        
        <div className="relative flex items-center gap-3 p-4">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 20,
              delay: 0.1,
            }}
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: style.iconBg }}
          >
            {style.icon}
          </motion.div>

          {/* Message */}
          <div className={`flex-1 ${style.textColor}`}>
            <p className="leading-tight">{message}</p>
          </div>

          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onClose(id)}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </motion.div>
    );
  }
);

ToastNotification.displayName = 'ToastNotification';