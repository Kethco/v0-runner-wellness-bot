"use client";

import { useState, useMemo } from "react";
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
import { Calendar, Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";

// Mock data - matches backend CheckIn type
const mockCheckins = [
  { id: "1", date: "2026-04-30", sleep: "Great", feeling: "Great", energy: 5, soreness: "None", readiness: "Yes", notes: "Feeling strong after rest day" },
  { id: "2", date: "2026-04-29", sleep: "Good", feeling: "Good", energy: 4, soreness: "Mild", readiness: "Yes", notes: "Legs a bit tired from tempo run" },
  { id: "3", date: "2026-04-28", sleep: "OK", feeling: "Fine", energy: 3, soreness: "Moderate", readiness: "Maybe", notes: "" },
  { id: "4", date: "2026-04-27", sleep: "Good", feeling: "Good", energy: 4, soreness: "Mild", readiness: "Yes", notes: "Easy recovery jog" },
  { id: "5", date: "2026-04-26", sleep: "Great", feeling: "Great", energy: 5, soreness: "None", readiness: "Yes", notes: "PR in 5K!" },
  { id: "6", date: "2026-04-25", sleep: "Poor", feeling: "Low", energy: 2, soreness: "High", readiness: "No", notes: "Needed rest" },
  { id: "7", date: "2026-04-24", sleep: "OK", feeling: "Fine", energy: 3, soreness: "Moderate", readiness: "Maybe", notes: "" },
  { id: "8", date: "2026-04-23", sleep: "Good", feeling: "Good", energy: 4, soreness: "None", readiness: "Yes", notes: "" },
  { id: "9", date: "2026-04-22", sleep: "Good", feeling: "Good", energy: 4, soreness: "Mild", readiness: "Yes", notes: "Intervals felt good" },
  { id: "10", date: "2026-04-21", sleep: "Great", feeling: "Great", energy: 5, soreness: "None", readiness: "Yes", notes: "" },
  { id: "11", date: "2026-04-20", sleep: "OK", feeling: "Fine", energy: 3, soreness: "Mild", readiness: "Yes", notes: "" },
  { id: "12", date: "2026-04-19", sleep: "Good", feeling: "Good", energy: 4, soreness: "None", readiness: "Yes", notes: "Long run completed" },
];

const ITEMS_PER_PAGE = 10;

function getSleepBadgeVariant(sleep: string) {
  switch (sleep) {
    case "Great": return "default";
    case "Good": return "secondary";
    case "OK": return "outline";
    case "Poor": return "destructive";
    default: return "outline";
  }
}

function getSorenessBadgeVariant(soreness: string) {
  switch (soreness) {
    case "None": return "default";
    case "Mild": return "secondary";
    case "Moderate": return "outline";
    case "High": return "destructive";
    default: return "outline";
  }
}

function getReadinessBadgeVariant(readiness: string) {
  switch (readiness) {
    case "Yes": return "default";
    case "Maybe": return "secondary";
    case "No": return "destructive";
    default: return "outline";
  }
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sleepFilter, setSleepFilter] = useState<string>("all");
  const [sorenessFilter, setSorenessFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCheckins = useMemo(() => {
    return mockCheckins.filter((checkin) => {
      const matchesSearch = searchQuery === "" || 
        checkin.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        checkin.date.includes(searchQuery);
      
      const matchesSleep = sleepFilter === "all" || checkin.sleep === sleepFilter;
      const matchesSoreness = sorenessFilter === "all" || checkin.soreness === sorenessFilter;
      
      return matchesSearch && matchesSleep && matchesSoreness;
    });
  }, [searchQuery, sleepFilter, sorenessFilter]);

  const totalPages = Math.ceil(filteredCheckins.length / ITEMS_PER_PAGE);
  const paginatedCheckins = filteredCheckins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Check-in History</h1>
            <p className="text-muted-foreground mt-1">
              View and filter your past wellness check-ins
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

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
              <div className="text-2xl font-bold text-foreground">{mockCheckins.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Check-ins</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-primary">7</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Current Streak</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-foreground">4.1</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Energy</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-foreground">83%</div>
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
                        <Badge variant={getSleepBadgeVariant(checkin.sleep)}>
                          {checkin.sleep}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{checkin.feeling}</Badge>
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
                          {checkin.soreness}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getReadinessBadgeVariant(checkin.readiness)}>
                          {checkin.readiness}
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
      </main>
    </div>
  );
}
