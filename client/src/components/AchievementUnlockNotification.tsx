/**
 * Achievement Unlock Notification Component
 * Displays animated toast when user unlocks achievements
 */

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface AchievementUnlockNotificationProps {
  achievements: Achievement[];
  onDismiss?: () => void;
}

const rarityColors: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: "bg-gray-100", text: "text-gray-900", border: "border-gray-300" },
  uncommon: { bg: "bg-green-100", text: "text-green-900", border: "border-green-300" },
  rare: { bg: "bg-blue-100", text: "text-blue-900", border: "border-blue-300" },
  epic: { bg: "bg-purple-100", text: "text-purple-900", border: "border-purple-300" },
  legendary: { bg: "bg-yellow-100", text: "text-yellow-900", border: "border-yellow-300" },
};

export function AchievementUnlockNotification({
  achievements,
  onDismiss,
}: AchievementUnlockNotificationProps) {
  const [displayed, setDisplayed] = useState(false);

  useEffect(() => {
    if (achievements && achievements.length > 0) {
      // Display each achievement with a staggered delay
      achievements.forEach((achievement, index) => {
        setTimeout(() => {
          showAchievementToast(achievement);
        }, index * 1500); // 1.5 second delay between each
      });

      setDisplayed(true);
      if (onDismiss) {
        setTimeout(onDismiss, achievements.length * 1500 + 3000);
      }
    }
  }, [achievements, onDismiss]);

  return null; // Toast is rendered by sonner globally
}

function showAchievementToast(achievement: Achievement) {
  const colors = rarityColors[achievement.rarity];

  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.4, type: "spring" }}
      className={`${colors.bg} ${colors.text} border-2 ${colors.border} rounded-lg p-4 shadow-lg max-w-sm`}
    >
      <div className="flex items-start gap-3">
        {/* Achievement Icon */}
        <div className="text-4xl flex-shrink-0">{achievement.icon}</div>

        {/* Achievement Details */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg">Achievement Unlocked!</div>
          <div className="font-semibold text-base mt-1">{achievement.name}</div>
          <div className="text-sm opacity-90 mt-1">{achievement.description}</div>

          {/* Points Badge */}
          <div className="mt-2 inline-block">
            <span className="text-xs font-bold px-2 py-1 bg-white bg-opacity-50 rounded">
              +{achievement.points} points
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="flex-shrink-0 text-lg opacity-50 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </motion.div>
  ), {
    duration: 5000,
    position: "top-right",
  });
}

/**
 * Hook to display achievement unlock notifications
 * Usage: const showAchievementUnlock = useAchievementNotification();
 *        showAchievementUnlock([achievement1, achievement2]);
 */
export function useAchievementNotification() {
  return (achievements: Achievement[]) => {
    if (achievements && achievements.length > 0) {
      achievements.forEach((achievement, index) => {
        setTimeout(() => {
          showAchievementToast(achievement);
        }, index * 1500);
      });
    }
  };
}
