import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const plan = user.user_metadata?.plan;
  
  // Can't cancel if already on free trial that expired or coach_athlete
  if (plan === "coach_athlete") {
    return NextResponse.json({ 
      error: "Your subscription is managed by your coach. Please contact them to make changes." 
    }, { status: 400 });
  }
  
  try {
    // Update user metadata to cancelled state
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        plan: "cancelled",
        cancelled_at: new Date().toISOString(),
        previous_plan: plan,
      }
    });
    
    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }
    
    // Update profile in database
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        plan: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    
    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Don't fail - the auth metadata update already succeeded
    }
    
    // TODO: If using Stripe, cancel the subscription there too
    // const stripeCustomerId = user.user_metadata?.stripe_customer_id;
    // if (stripeCustomerId) {
    //   await stripe.subscriptions.cancel(subscriptionId);
    // }
    
    return NextResponse.json({ 
      success: true, 
      message: "Subscription cancelled successfully" 
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
