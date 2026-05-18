import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

    const supabase = getSupabaseAdmin();

    // Normalize phone
    const normalizedPhone = phone?.replace(/\D/g, "") || "";
    const formattedPhone = normalizedPhone 
      ? (normalizedPhone.startsWith("1") ? `+${normalizedPhone}` : `+1${normalizedPhone}`)
      : "";

    // Check if user with email exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    if (existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ 
        error: "An account with this email already exists",
      }, { status: 400 });
    }

    // Check if phone number already exists (if provided)
    if (formattedPhone) {
      const phoneExists = existingUsers?.users?.some(u => {
        const userPhone = u.phone || u.user_metadata?.phone;
        if (!userPhone) return false;
        // Normalize both phones for comparison
        const normalizedExisting = userPhone.replace(/\D/g, "");
        const normalizedNew = formattedPhone.replace(/\D/g, "");
        return normalizedExisting === normalizedNew;
      });
      
      if (phoneExists) {
        return NextResponse.json({ 
          error: "An account with this phone number already exists",
        }, { status: 400 });
      }
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
      
      // If it's a database trigger error, the user might still be created
      // Check if user exists and return success if so
      if (authError.message?.includes("Database error") || authError.message?.includes("trigger")) {
        // Wait a moment for the user to be created
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
      
      // User-friendly error messages
      if (authError.message?.includes("already")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: "Could not create account. Please try again.",
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

// Create or update profile - only use columns that exist
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
    // Only use basic columns that definitely exist
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        role: data.user_type || "athlete",
      }, { onConflict: "id" });
    
    if (error) {
      console.error("Profile upsert error:", error);
    }
  } catch (err) {
    console.error("Profile creation error:", err);
  }
}
