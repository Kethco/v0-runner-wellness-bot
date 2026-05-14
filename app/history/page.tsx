"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Download, ChevronLeft, ChevronRight, Loader2, ClipboardList } from "lucide-react";

interface Checkin {
  id: string;
  date: string;
  sleep_rating: number;
  energy: number;
  soreness: number;
  readiness: number;
  feeling?: string;
  notes?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const ITEMS_PER_PAGE = 10;

function getSleepLabel(rating: number): string {
  switch (rating) {
    case 4: return "Great";
    case 3: return "Good";
    case 2: return "OK";
    case 1: return "Poor";
    default: return "OK";
  }
}

function getSorenessLabel(level: number): string {
  switch (level) {
    case 1: return "None";
    case 2: return "Mild";
    case 3: return "Moderate";
    case 4: return "High";
    default: return "None";
  }
}

function getReadinessLabel(level: number): string {
  if (level >= 4) return "Yes";
  if (level >= 3) return "Maybe";
  return "No";
}

function getFeelingLabel(feeling: string | undefined): string {
  if (!feeling) return "OK";
  return feeling.charAt(0).toUpperCase() + feeling.slice(1);
}

function getSleepBadgeVariant(rating: number) {
  switch (rating) {
    case 4: return "default";
    case 3: return "secondary";
    case 2: return "outline";
    case 1: return "destructive";
    default: return "outline";
  }
}

function getSorenessBadgeVariant(level: number) {
  switch (level) {
    case 1: return "default";
    case 2: return "secondary";
    case 3: return "outline";
    case 4: return "destructive";
    default: return "outline";
  }
}

function getReadinessBadgeVariant(level: number) {
  if (level >= 4) return "default";
  if (level >= 3) return "secondary";
  return "destructive";
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sleepFilter, setSleepFilter] = useState<string>("all");
  const [sorenessFilter, setSorenessFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  const { data, error, isLoading } = useSWR<{ checkins: Checkin[] }>(
    "/api/checkins?limit=100",
    fetcher
  );

  const checkins = data?.checkins || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCheckins = useMemo(() => {
    return checkins.filter((checkin) => {
      const matchesSearch = searchQuery === "" || 
        (checkin.notes?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        checkin.date.includes(searchQuery);
      
      const sleepLabel = getSleepLabel(checkin.sleep_rating);
      const sorenessLabel = getSorenessLabel(checkin.soreness);
      
      const matchesSleep = sleepFilter === "all" || sleepLabel === sleepFilter;
      const matchesSoreness = sorenessFilter === "all" || sorenessLabel === sorenessFilter;
      
      return matchesSearch && matchesSleep && matchesSoreness;
    });
  }, [checkins, searchQuery, sleepFilter, sorenessFilter]);

  const totalPages = Math.ceil(filteredCheckins.length / ITEMS_PER_PAGE);
  const paginatedCheckins = filteredCheckins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate stats
  const stats = useMemo(() => {
    if (checkins.length === 0) {
      return { total: 0, streak: 0, avgEnergy: 0, readyPercent: 0 };
    }
    
    const avgEnergy = checkins.reduce((sum, c) => sum + c.energy, 0) / checkins.length;
    const readyDays = checkins.filter((c) => c.readiness >= 4).length;
    const readyPercent = (readyDays / checkins.length) * 100;
    
    // Calculate streak (consecutive days)
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const sortedDates = checkins.map(c => c.date).sort().reverse();
    
    if (sortedDates[0] === today || sortedDates[0] === getYesterdayDate()) {
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return { total: checkins.length, streak, avgEnergy, readyPercent };
  }, [checkins]);

  function getYesterdayDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }

  const formatDate = (dateStr: string) => {
    if (!mounted) return dateStr;
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const handleExport = () => {
    if (checkins.length === 0) return;
    
    const headers = ["Date", "Sleep", "Energy", "Soreness", "Readiness", "Feeling", "Notes"];
    const rows = checkins.map(c => [
      c.date,
      getSleepLabel(c.sleep_rating),
      c.energy.toString(),
      getSorenessLabel(c.soreness),
      getReadinessLabel(c.readiness),
      c.feeling || "",
      c.notes || ""
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Treat errors as empty state (user may not be logged in or have no data yet)
  const showEmptyState = error || checkins.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[56px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Check-in History</h1>
            <p className="text-muted-foreground mt-1">
              View and filter your past wellness check-ins
            </p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleExport}
            disabled={checkins.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : showEmptyState ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Check-ins Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start your wellness journey by completing your first daily check-in.
              </p>
              <Button asChild>
                <a href="/">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <Card className="mb-6 border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by date or notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Select value={sleepFilter} onValueChange={setSleepFilter}>
                      <SelectTrigger className="w-[140px] bg-secondary border-border">
                        <SelectValue placeholder="Sleep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sleep</SelectItem>
                        <SelectItem value="Great">Great</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sorenessFilter} onValueChange={setSorenessFilter}>
                      <SelectTrigger className="w-[140px] bg-secondary border-border">
                        <SelectValue placeholder="Soreness" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Soreness</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Mild">Mild</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-border bg-card">
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Check-ins</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-primary">{stats.streak}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Current Streak</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-foreground">{stats.avgEnergy.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Energy</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-foreground">{stats.readyPercent.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Training Ready</div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">All Check-ins</CardTitle>
                <CardDescription>
                  Showing {paginatedCheckins.length} of {filteredCheckins.length} check-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground">Sleep</TableHead>
                        <TableHead className="text-muted-foreground">Feeling</TableHead>
                        <TableHead className="text-muted-foreground">Energy</TableHead>
                        <TableHead className="text-muted-foreground">Soreness</TableHead>
                        <TableHead className="text-muted-foreground">Ready</TableHead>
                        <TableHead className="text-muted-foreground">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCheckins.map((checkin) => (
                        <TableRow key={checkin.id} className="border-border">
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {formatDate(checkin.date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSleepBadgeVariant(checkin.sleep_rating)}>
                              {getSleepLabel(checkin.sleep_rating)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getFeelingLabel(checkin.feeling)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < checkin.energy ? "bg-primary" : "bg-secondary"
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm text-muted-foreground">
                                {checkin.energy}/5
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSorenessBadgeVariant(checkin.soreness)}>
                              {getSorenessLabel(checkin.soreness)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getReadinessBadgeVariant(checkin.readiness)}>
                              {getReadinessLabel(checkin.readiness)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {checkin.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
