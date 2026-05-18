"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/debug/workouts");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  const forceSkipDuringTravel = async () => {
    setActionMessage("Processing...");
    try {
      const res = await fetch("/api/debug/workouts", { method: "POST" });
      const json = await res.json();
      setActionMessage(json.message || "Done!");
      fetchData(); // Refresh data
    } catch (err) {
      setActionMessage("Error: " + String(err));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading workout data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card className="border-red-500">
          <CardContent className="p-6">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const workouts = data?.workouts || [];
  const lifeEvents = data?.lifeEvents || [];

  // Group workouts by status
  const byStatus: Record<string, any[]> = {};
  workouts.forEach((w: any) => {
    const status = w.status || "unknown";
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(w);
  });

  // Find workouts during life events (use 'date' field from API response)
  const workoutsDuringEvents = workouts.filter((w: any) => {
    return lifeEvents.some((e: any) => {
      const cannotRun = !e.canRun;
      const dateMatch = w.date >= e.start && w.date <= e.end;
      return cannotRun && dateMatch && w.status !== "skipped";
    });
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Training Plan Debug</h1>
          <div className="flex gap-2">
            <Button 
              onClick={forceSkipDuringTravel} 
              variant="destructive" 
              size="sm"
            >
              Force Skip Travel Workouts
            </Button>
            <Button onClick={fetchData} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">{actionMessage}</p>
          </div>
        )}

        {/* Life Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Life Events ({lifeEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {lifeEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No life events found</p>
            ) : (
              <div className="space-y-2">
                {lifeEvents.map((e: any) => (
                  <div key={e.id} className="p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{e.event_type}</Badge>
                      <span className="text-sm font-medium">{e.start_date} → {e.end_date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Can run: {e.can_run ? "Yes" : "No"} | Impact: {e.training_impact}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workout Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-secondary rounded-lg text-center">
                <p className="text-2xl font-bold">{workouts.length}</p>
                <p className="text-xs text-muted-foreground">Total Workouts</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-500">{byStatus["planned"]?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Planned</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-500">{byStatus["rescheduled"]?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Rescheduled</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-500">{byStatus["skipped"]?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workouts During Life Events - THE KEY INFO */}
        <Card className="border-amber-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-amber-500">
                Workouts Still During Life Events ({workoutsDuringEvents.length})
              </CardTitle>
              {workoutsDuringEvents.length > 0 && (
                <Button 
                  onClick={forceSkipDuringTravel} 
                  variant="destructive" 
                  size="sm"
                >
                  Skip These Workouts
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {workoutsDuringEvents.length === 0 ? (
              <p className="text-green-500 text-sm">All workouts have been moved out of life event dates!</p>
            ) : (
              <div className="space-y-2">
                {workoutsDuringEvents.map((w: any) => (
                  <div key={w.id} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{w.scheduled_date}</span>
                        <span className="text-muted-foreground mx-2">|</span>
                        <span>{w.workout_type}</span>
                        <span className="text-muted-foreground mx-2">|</span>
                        <span>{w.target_miles} mi</span>
                      </div>
                      <Badge variant={w.status === "planned" ? "destructive" : "secondary"}>
                        {w.status}
                      </Badge>
                    </div>
                    {w.original_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Original date: {w.original_date}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Workouts (Next 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {workouts.slice(0, 30).map((w: any) => {
                const isDuringEvent = lifeEvents.some((e: any) => 
                  w.scheduled_date >= e.start_date && w.scheduled_date <= e.end_date
                );
                return (
                  <div 
                    key={w.id} 
                    className={`p-2 rounded text-sm flex items-center justify-between ${
                      isDuringEvent ? "bg-amber-500/20" : "bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs w-24">{w.scheduled_date}</span>
                      <span className="w-20">{w.workout_type}</span>
                      <span className="text-muted-foreground">{w.target_miles} mi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.original_date && w.original_date !== w.scheduled_date && (
                        <span className="text-xs text-blue-400">was: {w.original_date}</span>
                      )}
                      <Badge variant="outline" className="text-[10px]">{w.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
