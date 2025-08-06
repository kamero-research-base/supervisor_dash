import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AlertNotificationProps {
  message: string;
  type: "success" | "error" | "info";
}

const AlertNotification: React.FC<AlertNotificationProps> = ({ message, type }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 10000; // 10 seconds
    const interval = 50; // Update every 50ms
    const decrement = (100 / duration) * interval;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(progressTimer);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          bgGradient: "from-emerald-500/20 to-teal-500/20",
          borderColor: "border-emerald-400/30",
          textColor: "text-emerald-700",
          progressColor: "bg-emerald-500",
          iconClass: "bi bi-check-circle-fill",
          iconColor: "text-emerald-600"
        };
      case "error":
        return {
          bgGradient: "from-red-500/20 to-rose-500/20",
          borderColor: "border-red-400/30",
          textColor: "text-red-700",
          progressColor: "bg-red-500",
          iconClass: "bi bi-x-circle-fill",
          iconColor: "text-red-600"
        };
      case "info":
        return {
          bgGradient: "from-cyan-500/20 to-teal-500/20",
          borderColor: "border-cyan-400/30",
          textColor: "text-cyan-700",
          progressColor: "bg-cyan-500",
          iconClass: "bi bi-info-circle-fill",
          iconColor: "text-cyan-600"
        };
      default:
        return {
          bgGradient: "from-gray-500/20 to-slate-500/20",
          borderColor: "border-gray-400/30",
          textColor: "text-gray-700",
          progressColor: "bg-gray-500",
          iconClass: "bi bi-info-circle-fill",
          iconColor: "text-gray-600"
        };
    }
  };

  const config = getConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-5 left-0 right-0 flex items-center justify-center z-50 px-4"
        >
          <div className="relative max-w-md w-full">
            {/* Backdrop blur container */}
            <div className={`
              relative overflow-hidden rounded-xl shadow-2xl
              bg-white/80 backdrop-blur-xl
              border ${config.borderColor}
              bg-gradient-to-r ${config.bgGradient}
            `}>
              {/* Content */}
              <div className="px-4 py-3 flex items-center gap-3">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full
                  bg-white/50 backdrop-blur-sm
                  flex items-center justify-center
                  shadow-sm
                `}>
                  <i className={`${config.iconClass} ${config.iconColor} text-lg`} />
                </div>

                {/* Message */}
                <div className="flex-1">
                  <p className={`font-medium ${config.textColor}`}>
                    {message}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsVisible(false)}
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full
                    bg-white/30 hover:bg-white/50
                    backdrop-blur-sm transition-all duration-200
                    flex items-center justify-center
                    group hover:scale-110
                  `}
                >
                  <i className={`bi bi-x ${config.textColor} text-sm group-hover:rotate-90 transition-transform duration-200 inline-block`} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-white/20 backdrop-blur-sm">
                <motion.div
                  className={`h-full ${config.progressColor} shadow-sm`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.05, ease: "linear" }}
                />
              </div>
            </div>

            {/* Subtle shadow effect */}
            <div className={`
              absolute inset-0 -z-10 blur-2xl opacity-20
              bg-gradient-to-r ${config.bgGradient}
              transform scale-110
            `} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertNotification;