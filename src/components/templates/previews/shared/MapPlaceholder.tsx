import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address?: string;
  x: number; // percentage position
  y: number; // percentage position
}

interface MapPlaceholderProps {
  locations?: Location[];
  height?: string;
  className?: string;
  primaryColor?: string;
}

export const MapPlaceholder = ({
  locations = [
    { id: "1", name: "Москва", address: "ул. Тверская, 1", x: 55, y: 35 },
    { id: "2", name: "Санкт-Петербург", address: "Невский пр., 28", x: 50, y: 25 },
    { id: "3", name: "Екатеринбург", address: "ул. Ленина, 50", x: 75, y: 40 },
  ],
  height = "300px",
  className = "",
  primaryColor = "primary",
}: MapPlaceholderProps) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-zinc-900 ${className}`}
      style={{ height }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Stylized map outline (abstract) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M10,30 Q25,20 40,25 T60,20 T80,30 Q90,40 85,55 T90,75 Q80,85 60,80 T30,85 Q15,80 10,65 T10,30"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-zinc-400"
        />
      </svg>

      {/* Location markers */}
      {locations.map((location, index) => (
        <motion.div
          key={location.id}
          className="absolute group cursor-pointer"
          style={{ left: `${location.x}%`, top: `${location.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.2 }}
        >
          {/* Pulse effect */}
          <motion.div
            className={`absolute -inset-3 rounded-full bg-${primaryColor}/20`}
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
          />

          {/* Marker */}
          <motion.div
            whileHover={{ scale: 1.2 }}
            className={`relative w-4 h-4 rounded-full bg-${primaryColor} shadow-lg shadow-${primaryColor}/50`}
          >
            <div className="absolute inset-1 rounded-full bg-white/30" />
          </motion.div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-zinc-800 rounded-lg px-3 py-2 shadow-xl border border-zinc-700 whitespace-nowrap">
              <p className="text-sm font-medium text-white">{location.name}</p>
              {location.address && (
                <p className="text-xs text-zinc-400">{location.address}</p>
              )}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-zinc-800 rotate-45 border-r border-b border-zinc-700" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* Decorative elements */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <div className="w-8 h-8 rounded bg-zinc-800/80 flex items-center justify-center text-zinc-500 text-xs">+</div>
        <div className="w-8 h-8 rounded bg-zinc-800/80 flex items-center justify-center text-zinc-500 text-xs">−</div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

// Contact card with map
interface ContactCardProps {
  location: Location;
  phone?: string;
  email?: string;
  hours?: string;
  className?: string;
}

export const ContactCard = ({
  location,
  phone,
  email,
  hours,
  className = "",
}: ContactCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 ${className}`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-white">{location.name}</h4>
          {location.address && (
            <p className="text-sm text-zinc-400">{location.address}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {phone && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Phone className="w-4 h-4" />
            <span>{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Mail className="w-4 h-4" />
            <span>{email}</span>
          </div>
        )}
        {hours && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="w-4 h-4" />
            <span>{hours}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
