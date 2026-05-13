import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name, phone, user_type, plan, program_name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = phone?.replace(/\D/g, "") || "";
    const formattedPhone = normalizedPhone 
      ? (normalizedPhone.startsWith("1") ? `+${normalizedPhone}` : `+1${normalizedPhone}`)
      : "";

    // Create user directly with Supabase Admin API
    // email_confirm: true skips email verification
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      phone: formattedPhone || undefined,
      phone_confirm: true, // Skip phone verification
      user_metadata: {
        first_name: first_name || "",
        last_name: last_name || "",
        phone: formattedPhone,
        user_type: user_type || "athlete",
        role: user_type || "athlete",
        plan: plan || "free_trial",
        ...(program_name && { program_name }),
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      
      // Check if user already exists
      if (authError.message?.includes("already") || authError.message?.includes("exists")) {
        return NextResponse.json({ 
          error: "An account with this email already exists. Please log in instead.",
        }, { status: 400 });
      }
      
      // If database trigger fails, manually create profile after user
      if (authError.message?.includes("Database error")) {
        // The user might still be created, just the trigger failed
        // Try to find the user and create profile manually
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === email);
        
        if (existingUser) {
          // User exists, just create profile
          await createProfile(existingUser.id, {
            first_name, last_name, email, phone: formattedPhone, user_type, plan, program_name
          });
          
          return NextResponse.json({ 
            success: true, 
            message: "Account created successfully",
            userId: existingUser.id,
            userType: user_type || "athlete",
          });
        }
        
        return NextResponse.json({ 
          error: "Account setup issue. Please try again or contact support.",
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: authError.message || "Failed to create account",
      }, { status: 500 });
    }

    // Create profile manually (in case trigger doesn't work)
    if (authData?.user) {
      await createProfile(authData.user.id, {
        first_name, last_name, email, phone: formattedPhone, user_type, plan, program_name
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Account created successfully",
      userId: authData?.user?.id,
      userType: user_type || "athlete",
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

async function createProfile(userId: string, data: {
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  user_type?: string;
  plan?: string;
  program_name?: string;
}) {
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    email: data.email,
    phone: data.phone,
    role: data.user_type || "athlete",
    plan: data.plan || "free_trial",
    trial_ends_at: data.plan === "coach_athlete" ? null : trialEndsAt,
    created_at: new Date().toISOString(),
  }, { onConflict: "id" });
  
  if (error) {
    console.error("Profile creation error (non-fatal):", error);
  }
}
