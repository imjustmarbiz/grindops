import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

export interface CalendarActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: Date;
  icon?: any;
  color?: string;
  badgeVariant?: string;
}

export interface ActivityTypeConfig {
  label: string;
  color: string;
  dotColor: string;
}

interface ActivityCalendarProps {
  activities: CalendarActivity[];
  typeConfig: Record<string, ActivityTypeConfig>;
  title?: string;
  accentColor?: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface QuickFilter {
  label: string;
  key: string;
  getRange: () => [Date, Date];
}

function getQuickFilters(): QuickFilter[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

  return [
    {
      label: "Today",
      key: "today",
      getRange: () => {
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
        return [today, end];
      },
    },
    {
      label: "Tomorrow",
      key: "tomorrow",
      getRange: () => [tomorrow, endOfTomorrow],
    },
    {
      label: "Last 7 Days",
      key: "7days",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
        return [start, end];
      },
    },
    {
      label: "Last 2 Weeks",
      key: "2weeks",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 13);
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
        return [start, end];
      },
    },
    {
      label: "This Month",
      key: "month",
      getRange: () => {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return [start, end];
      },
    },
    {
      label: "This Year",
      key: "year",
      getRange: () => {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear() + 1, 0, 1);
        return [start, end];
      },
    },
  ];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, start: Date, end: Date) {
  return date >= start && date < end;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const accentClasses: Record<string, { todayRing: string; selectedBg: string; selectedRing: string; todayText: string; filterActive: string }> = {
  purple: {
    todayRing: "ring-1 ring-purple-500/50",
    selectedBg: "bg-purple-500/15 ring-2 ring-purple-400",
    todayText: "text-purple-400 font-bold",
    filterActive: "bg-purple-600 hover:bg-purple-700 text-white",
    selectedRing: "ring-2 ring-purple-400",
  },
  cyan: {
    todayRing: "ring-1 ring-cyan-500/50",
    selectedBg: "bg-cyan-500/15 ring-2 ring-cyan-400",
    todayText: "text-cyan-400 font-bold",
    filterActive: "bg-cyan-600 hover:bg-cyan-700 text-white",
    selectedRing: "ring-2 ring-cyan-400",
  },
};

export function ActivityCalendar({
  activities,
  typeConfig,
  title = "Activity Calendar",
  accentColor = "purple",
}: ActivityCalendarProps) {
  const accent = accentClasses[accentColor] || accentClasses.purple;
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const [activeFilter, setActiveFilter] = useState<string>("today");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(Object.keys(typeConfig)));

  const quickFilters = useMemo(() => getQuickFilters(), []);

  const activityMap = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>();
    activities.forEach((a) => {
      const d = new Date(a.date);
      const k = dateKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    });
    return map;
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let items: CalendarActivity[];

    if (activeFilter === "custom" && selectedDay) {
      items = activities.filter((a) => isSameDay(new Date(a.date), selectedDay));
    } else {
      const filter = quickFilters.find((f) => f.key === activeFilter);
      if (filter) {
        const [start, end] = filter.getRange();
        items = activities.filter((a) => isInRange(new Date(a.date), start, end));
      } else {
        items = [];
      }
    }

    if (activeTypes.size < Object.keys(typeConfig).length) {
      items = items.filter((a) => activeTypes.has(a.type));
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, activeFilter, selectedDay, quickFilters, activeTypes, typeConfig]);

  const navigateMonth = useCallback(
    (dir: number) => {
      let newMonth = viewMonth + dir;
      let newYear = viewYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      setViewMonth(newMonth);
      setViewYear(newYear);
    },
    [viewMonth, viewYear],
  );

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDay(now);
    setActiveFilter("today");
  }, []);

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDay(day);
    setActiveFilter("custom");
  }, []);

  const handleQuickFilter = useCallback(
    (key: string) => {
      setActiveFilter(key);
      setSelectedDay(null);
      const filter = quickFilters.find((f) => f.key === key);
      if (filter) {
        const [start] = filter.getRange();
        setViewYear(start.getFullYear());
        setViewMonth(start.getMonth());
      }
    },
    [quickFilters],
  );

  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    return days;
  }, [viewYear, viewMonth, daysInMonth, firstDay]);

  const filterRange = useMemo(() => {
    if (activeFilter === "custom") return null;
    const filter = quickFilters.find((f) => f.key === activeFilter);
    return filter ? filter.getRange() : null;
  }, [activeFilter, quickFilters]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(-1)}
                  className="h-8 w-8 hover:bg-white/10"
                  data-testid="button-cal-prev-month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle
                  className="text-lg font-semibold cursor-pointer hover:text-white/80 transition-colors"
                  onClick={goToToday}
                  data-testid="text-cal-month-year"
                >
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(1)}
                  className="h-8 w-8 hover:bg-white/10"
                  data-testid="button-cal-next-month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="text-xs border-white/10 hover:bg-white/10"
                data-testid="button-cal-today"
              >
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 mb-2">
              {DAYS_OF_WEEK.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-white/5 rounded-lg overflow-hidden">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="bg-background/50 min-h-[52px] sm:min-h-[72px]"
                    />
                  );
                }

                const k = dateKey(day);
                const dayActivities = activityMap.get(k) || [];
                const filteredDayActivities = dayActivities.filter((a) => activeTypes.has(a.type));
                const isToday = isSameDay(day, today);
                const isSelected =
                  activeFilter === "custom" &&
                  selectedDay &&
                  isSameDay(day, selectedDay);
                const isHighlighted =
                  filterRange && isInRange(day, filterRange[0], filterRange[1]);

                const uniqueTypes = Array.from(
                  new Set(filteredDayActivities.map((a) => a.type)),
                );

                return (
                  <button
                    key={k}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative bg-background/50 min-h-[52px] sm:min-h-[72px] p-1 sm:p-1.5 text-left transition-all hover:bg-white/10 group
                      ${isToday && !isSelected ? accent.todayRing : ""}
                      ${isSelected ? accent.selectedBg : ""}
                      ${isHighlighted && !isSelected ? "bg-white/[0.04]" : ""}
                    `}
                    data-testid={`cal-day-${k}`}
                  >
                    <span
                      className={`
                        text-xs font-medium block mb-1
                        ${isToday ? accent.todayText : "text-muted-foreground group-hover:text-foreground"}
                        ${isSelected ? "text-white" : ""}
                      `}
                    >
                      {day.getDate()}
                    </span>
                    {uniqueTypes.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {uniqueTypes.slice(0, 4).map((type) => (
                          <span
                            key={type}
                            className={`w-1.5 h-1.5 rounded-full ${typeConfig[type]?.dotColor || "bg-gray-400"}`}
                          />
                        ))}
                        {filteredDayActivities.length > 0 && (
                          <span className="text-[10px] text-muted-foreground ml-0.5">
                            {filteredDayActivities.length}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="pt-4">
            <div className="hidden sm:flex flex-wrap gap-2 mb-4">
              {quickFilters.map((f) => (
                <Button
                  key={f.key}
                  variant={activeFilter === f.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter(f.key)}
                  className={`text-xs ${
                    activeFilter === f.key
                      ? accent.filterActive
                      : "border-white/10"
                  }`}
                  data-testid={`button-filter-${f.key}`}
                >
                  {f.label}
                </Button>
              ))}
              {activeFilter === "custom" && selectedDay && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/10"
                  data-testid="badge-custom-date"
                >
                  {selectedDay.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Badge>
              )}
            </div>

            <div className="sm:hidden flex items-center gap-2 mb-4">
              <div className="flex-1">
                <Select
                  value={activeFilter === "custom" ? "custom" : activeFilter}
                  onValueChange={(val) => {
                    if (val !== "custom") handleQuickFilter(val);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white/[0.03] border-white/[0.08]" data-testid="select-quick-filter-mobile">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0f] border-white/[0.08]">
                    {quickFilters.map((f) => (
                      <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                    ))}
                    {activeFilter === "custom" && selectedDay && (
                      <SelectItem value="custom">
                        {selectedDay.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select
                  value={
                    activeTypes.size === Object.keys(typeConfig).length
                      ? "all"
                      : activeTypes.size === 0
                        ? "none"
                        : Array.from(activeTypes)[0]
                  }
                  onValueChange={(val) => {
                    if (val === "all") {
                      setActiveTypes(new Set(Object.keys(typeConfig)));
                    } else if (val === "none") {
                      setActiveTypes(new Set());
                    } else {
                      setActiveTypes(new Set([val]));
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white/[0.03] border-white/[0.08]" data-testid="select-type-filter-mobile">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Filter type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0f] border-white/[0.08]">
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(typeConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 mb-3">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Filter by type:</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(typeConfig).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`
                      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-all
                      ${activeTypes.has(type) ? `${config.color} opacity-100` : "bg-white/5 text-muted-foreground opacity-50"}
                    `}
                    data-testid={`button-toggle-type-${type}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-1">
        <Card className="border-white/10 bg-white/[0.02] sticky top-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Activities
              </CardTitle>
              <Badge
                variant="secondary"
                className="text-xs bg-white/10"
                data-testid="badge-activity-count"
              >
                {filteredActivities.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-2">
              <AnimatePresence mode="popLayout">
                {filteredActivities.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No activities for this period</p>
                  </motion.div>
                ) : (
                  filteredActivities.map((activity, idx) => {
                    const config = typeConfig[activity.type];
                    const IconComp = activity.icon;
                    return (
                      <motion.div
                        key={activity.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.02 }}
                        className="mb-2"
                      >
                        <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group">
                          <div
                            className={`mt-0.5 p-1.5 rounded-md shrink-0 ${config?.color || "bg-white/10"}`}
                          >
                            {IconComp ? (
                              <IconComp className="w-3.5 h-3.5" />
                            ) : (
                              <CalendarDays className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium text-foreground leading-tight break-words">
                                {activity.title}
                              </p>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] shrink-0 ${config?.color || "bg-white/10"}`}
                              >
                                {config?.label || activity.type}
                              </Badge>
                            </div>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 break-words line-clamp-2">
                                {activity.description}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {new Date(activity.date).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
