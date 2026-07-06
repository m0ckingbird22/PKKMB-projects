import { Users, MapPin, Monitor, Flag } from "lucide-react";

interface StatCardsProps {
  totalHadir: number;
  offline: number;
  online: number;
  flagged: number;
}

export function StatCards({
  totalHadir,
  offline,
  online,
  flagged,
}: StatCardsProps) {
  const cards = [
    {
      label: "Total Hadir",
      value: totalHadir,
      icon: Users,
      iconColor: "text-indigo-600",
    },
    {
      label: "offline",
      value: offline,
      icon: MapPin,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "online",
      value: online,
      icon: Monitor,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      label: "flagged",
      value: flagged,
      icon: Flag,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
        <div
          key={label}
          className="bg-white rounded-lg border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center 
  ${iconBg}`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
