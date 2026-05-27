import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkKayCheckins() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name")
    .ilike("first_name", "%kay%")
    .single();

  if (!profile) {
    console.log("Kay not found");
    return;
  }

  console.log("Kay's profile:", profile);

  const { data: checkins } = await supabase
    .from("checkins")
    .select("id, date, created_at, sleep_rating, energy, soreness")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("Kay's checkins:", checkins);
}

checkKayCheckins();
