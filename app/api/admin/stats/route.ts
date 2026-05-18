import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function GET() {
  const supabase = await createClient();

  // Verify user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient();

  // Get date ranges
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  // Fetch all stats in parallel
  const [
    totalUsersRes,
    newUsersWeekRes,
    newUsersMonthRes,
    activeToday,
    activeWeekRes,
    totalCheckinsRes,
    checkinsWeekRes,
    totalRunsRes,
    runsWeekRes,
    totalTeamsRes,
    coachesRes,
    athletesInTeamsRes,
    usersByTypeRes,
    usersByPlanRes,
    dailyCheckinsRes,
    recentUsersRes,
  ] = await Promise.all([
    serviceClient.from("profiles").select("id", { count: "exact", head: true }),
    serviceClient.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    serviceClient.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
    serviceClient.from("checkins").select("user_id", { count: "exact", head: true }).eq("date", today),
    serviceClient.from("checkins").select("user_id").gte("date", weekAgo),
    serviceClient.from("checkins").select("id", { count: "exact", head: true }),
    serviceClient.from("checkins").select("id", { count: "exact", head: true }).gte("date", weekAgo),
    serviceClient.from("runs").select("id", { count: "exact", head: true }),
    serviceClient.from("runs").select("id", { count: "exact", head: true }).gte("date", weekAgo),
    serviceClient.from("teams").select("id", { count: "exact", head: true }),
    serviceClient.from("profiles").select("id", { count: "exact", head: true }).eq("user_type", "coach"),
    serviceClient.from("team_members").select("id", { count: "exact", head: true }).eq("role", "athlete"),
    serviceClient.from("profiles").select("user_type"),
    serviceClient.from("profiles").select("plan"),
    serviceClient.from("checkins").select("date").gte("date", weekAgo),
    serviceClient.from("profiles").select("id, email, first_name, last_name, user_type, plan, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  // Calculate unique active users this week
  const uniqueActiveWeek = new Set(activeWeekRes.data?.map((c) => c.user_id)).size;

  // Process users by type
  const usersByType = { athlete: 0, coach: 0 };
  usersByTypeRes.data?.forEach((u) => {
    if (u.user_type === "coach") usersByType.coach++;
    else usersByType.athlete++;
  });

  // Process users by plan
  const usersByPlan: Record<string, number> = {};
  usersByPlanRes.data?.forEach((u) => {
    const plan = u.plan || "free_trial";
    usersByPlan[plan] = (usersByPlan[plan] || 0) + 1;
  });

  // Process daily check-ins for chart
  const dailyCheckins: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    dailyCheckins[date] = 0;
  }
  dailyCheckinsRes.data?.forEach((c) => {
    if (dailyCheckins[c.date] !== undefined) {
      dailyCheckins[c.date]++;
    }
  });

  // Get Stripe data
  let stripeStats = {
    mrr: 0,
    activeSubscriptions: 0,
    subscriptionsByPlan: {} as Record<string, number>,
    balance: 0,
  };

  const stripe = getStripe();
  if (stripe) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
      });

      stripeStats.activeSubscriptions = subscriptions.data.length;

      subscriptions.data.forEach((sub) => {
        const amount = sub.items.data[0]?.price?.unit_amount || 0;
        const interval = sub.items.data[0]?.price?.recurring?.interval;
        const monthlyAmount = interval === "year" ? amount / 12 : amount;
        stripeStats.mrr += monthlyAmount;

        const productName = sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.id || "unknown";
        stripeStats.subscriptionsByPlan[productName] = (stripeStats.subscriptionsByPlan[productName] || 0) + 1;
      });

      const balance = await stripe.balance.retrieve();
      stripeStats.balance = balance.available.reduce((sum, b) => sum + b.amount, 0);
    } catch (e) {
      console.error("Stripe error:", e);
    }
  }

  // Calculate engagement rate
  const totalUsers = totalUsersRes.count || 1;
  const engagementRate = (((activeToday.count || 0) / totalUsers) * 100).toFixed(1);
  const weeklyEngagementRate = ((uniqueActiveWeek / totalUsers) * 100).toFixed(1);

  return NextResponse.json({
    overview: {
      totalUsers: totalUsersRes.count || 0,
      newUsersWeek: newUsersWeekRes.count || 0,
      newUsersMonth: newUsersMonthRes.count || 0,
      activeToday: activeToday.count || 0,
      activeWeek: uniqueActiveWeek,
      engagementRate: parseFloat(engagementRate),
      weeklyEngagementRate: parseFloat(weeklyEngagementRate),
    },
    activity: {
      totalCheckins: totalCheckinsRes.count || 0,
      checkinsWeek: checkinsWeekRes.count || 0,
      totalRuns: totalRunsRes.count || 0,
      runsWeek: runsWeekRes.count || 0,
      dailyCheckins: Object.entries(dailyCheckins).map(([date, count]) => ({ date, count })),
    },
    teams: {
      totalTeams: totalTeamsRes.count || 0,
      totalCoaches: coachesRes.count || 0,
      athletesInTeams: athletesInTeamsRes.count || 0,
    },
    users: {
      byType: usersByType,
      byPlan: usersByPlan,
      recent: recentUsersRes.data || [],
    },
    revenue: {
      mrr: stripeStats.mrr / 100,
      activeSubscriptions: stripeStats.activeSubscriptions,
      subscriptionsByPlan: stripeStats.subscriptionsByPlan,
      balance: stripeStats.balance / 100,
    },
  });
}
