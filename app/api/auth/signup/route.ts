import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, phone, user_type, plan, program_name, coach_id } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Normalize phone
    const normalizedPhone = phone?.replace(/\D/g, "") || "";
    const formattedPhone = normalizedPhone 
      ? (normalizedPhone.startsWith("1") ? `+${normalizedPhone}` : `+1${normalizedPhone}`)
      : "";

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    if (existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ 
        error: "An account with this email already exists",
      }, { status: 400 });
    }

    // Create user with metadata including coach_id for linking
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: formattedPhone || undefined,
      phone_confirm: true,
      user_metadata: {
        first_name: first_name || "",
        last_name: last_name || "",
        phone: formattedPhone || "",
        user_type: user_type || "athlete",
        role: user_type || "athlete",
        plan: plan || "free_trial",
        ...(coach_id && { coach_id }),
        ...(program_name && { program_name }),
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      
      // If it's a database trigger error, the user might still be created
      // Check if user exists and return success if so
      if (authError.message?.includes("Database error")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const createdUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (createdUser) {
          // User was created despite trigger error - manually create/update profile
          await createProfile(createdUser.id, {
            first_name, last_name, email, phone: formattedPhone, user_type, plan, coach_id
          });
          
          return NextResponse.json({ 
            success: true, 
            userId: createdUser.id,
            userType: user_type || "athlete",
          });
        }
      }
      
      return NextResponse.json({ 
        error: authError.message || "Failed to create account",
      }, { status: 500 });
    }

    // Manually create/update profile (don't rely on trigger)
    if (authData?.user) {
      await createProfile(authData.user.id, {
        first_name, last_name, email, phone: formattedPhone, user_type, plan, coach_id
      });
    }

    return NextResponse.json({ 
      success: true, 
      userId: authData?.user?.id,
      userType: user_type || "athlete",
    });
    
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ 
      error: "Something went wrong. Please try again.",
    }, { status: 500 });
  }
}

// Create or update profile using upsert
async function createProfile(userId: string, data: {
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  user_type?: string;
  plan?: string;
  coach_id?: string;
}) {
  try {
    // First try to upsert with all fields
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        role: data.user_type || "athlete",
        plan: data.plan || "free_trial",
        coach_id: data.coach_id || null,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" });
    
    if (error) {
      console.error("Profile upsert error:", error);
      // If upsert fails (missing columns), try minimal update
      await supabase
        .from("profiles")
        .update({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
        })
        .eq("id", userId);
    }
  } catch (err) {
    console.error("Profile creation error:", err);
  }
}
