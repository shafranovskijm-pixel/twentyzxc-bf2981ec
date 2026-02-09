import { motion } from "framer-motion";
import { 
  User, FileText, MessageSquare, Star, Upload, 
  Download, Edit, Trash2, CheckCircle, Clock, AlertCircle 
} from "lucide-react";

type ActivityType = "comment" | "update" | "create" | "delete" | "upload" | "download" | "review" | "complete";

interface Activity {
  id: string;
  type: ActivityType;
  user: {
    name: string;
    avatar?: string;
  };
  target?: string;
  timestamp: string;
  message?: string;
}

interface ActivityFeedProps {
  activities?: Activity[];
  maxItems?: number;
  showTimestamp?: boolean;
  className?: string;
}

const activityConfig: Record<ActivityType, { 
  icon: typeof User; 
  color: string; 
  bg: string;
  verb: string;
}> = {
  comment: {
    icon: MessageSquare,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    verb: "прокомментировал",
  },
  update: {
    icon: Edit,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    verb: "обновил",
  },
  create: {
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    verb: "создал",
  },
  delete: {
    icon: Trash2,
    color: "text-red-400",
    bg: "bg-red-500/20",
    verb: "удалил",
  },
  upload: {
    icon: Upload,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    verb: "загрузил",
  },
  download: {
    icon: Download,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
    verb: "скачал",
  },
  review: {
    icon: Star,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    verb: "оставил отзыв",
  },
  complete: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    verb: "завершил",
  },
};

const defaultActivities: Activity[] = [
  { id: "1", type: "comment", user: { name: "Алексей М." }, target: "Отчёт за Q4", timestamp: "2 мин назад" },
  { id: "2", type: "upload", user: { name: "Мария К." }, target: "presentation.pdf", timestamp: "15 мин назад" },
  { id: "3", type: "complete", user: { name: "Дмитрий В." }, target: "Задача #1234", timestamp: "1 час назад" },
  { id: "4", type: "update", user: { name: "Елена С." }, target: "Проект Alpha", timestamp: "2 часа назад" },
  { id: "5", type: "create", user: { name: "Иван П." }, target: "Новый документ", timestamp: "3 часа назад" },
];

export const ActivityFeed = ({
  activities = defaultActivities,
  maxItems = 5,
  showTimestamp = true,
  className = "",
}: ActivityFeedProps) => {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className={`space-y-1 ${className}`}>
      {displayedActivities.map((activity, index) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            {/* Avatar or icon */}
            <div className="relative flex-shrink-0">
              {activity.user.avatar ? (
                <img
                  src={activity.user.avatar}
                  alt={activity.user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-zinc-400">
                    {activity.user.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
              )}
              {/* Activity type indicator */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${config.bg} flex items-center justify-center`}>
                <Icon className={`w-2.5 h-2.5 ${config.color}`} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300">
                <span className="font-medium text-white">{activity.user.name}</span>
                {" "}
                <span className="text-zinc-500">{config.verb}</span>
                {activity.target && (
                  <>
                    {" "}
                    <span className="text-primary">{activity.target}</span>
                  </>
                )}
              </p>
              {activity.message && (
                <p className="text-sm text-zinc-500 mt-1 truncate">{activity.message}</p>
              )}
              {showTimestamp && (
                <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.timestamp}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Compact activity item for sidebars
interface ActivityItemProps {
  activity: Activity;
  className?: string;
}

export const ActivityItem = ({ activity, className = "" }: ActivityItemProps) => {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 py-2 ${className}`}>
      <div className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center`}>
        <Icon className={`w-3 h-3 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400 truncate">
          <span className="text-zinc-200">{activity.user.name}</span> {config.verb} {activity.target}
        </p>
      </div>
      <span className="text-xs text-zinc-600 flex-shrink-0">{activity.timestamp}</span>
    </div>
  );
};

// Live activity indicator
interface LiveIndicatorProps {
  count?: number;
  className?: string;
}

export const LiveIndicator = ({ count, className = "" }: LiveIndicatorProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-emerald-500"
      />
      <span className="text-xs text-zinc-400">
        {count ? `${count} онлайн` : "Live"}
      </span>
    </div>
  );
};
