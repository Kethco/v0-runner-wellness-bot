import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch user's shoes
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: shoes, error } = await supabase
    .from("shoes")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === "42P01") {
      return NextResponse.json({ shoes: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shoes: shoes || [] });
}

// POST - Add a new shoe
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { brand, model, nickname, purchaseDate, initialMiles, maxMiles, isDefault } = body;

  if (!brand || !model) {
    return NextResponse.json({ error: "Brand and model are required" }, { status: 400 });
  }

  // If this is the default shoe, unset other defaults first
  if (isDefault) {
    await supabase
      .from("shoes")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { data: shoe, error } = await supabase
    .from("shoes")
    .insert({
      user_id: user.id,
      brand,
      model,
      nickname: nickname || null,
      purchase_date: purchaseDate || new Date().toISOString().split("T")[0],
      initial_miles: initialMiles || 0,
      total_miles: initialMiles || 0,
      max_miles: maxMiles || 500,
      is_default: isDefault || false,
      is_retired: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shoe });
}

// PATCH - Update a shoe
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, brand, model, nickname, maxMiles, isDefault, isRetired, addMiles } = body;

  if (!id) {
    return NextResponse.json({ error: "Shoe ID is required" }, { status: 400 });
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (brand !== undefined) updates.brand = brand;
  if (model !== undefined) updates.model = model;
  if (nickname !== undefined) updates.nickname = nickname;
  if (maxMiles !== undefined) updates.max_miles = maxMiles;
  if (isRetired !== undefined) updates.is_retired = isRetired;

  // If setting as default, unset other defaults first
  if (isDefault) {
    await supabase
      .from("shoes")
      .update({ is_default: false })
      .eq("user_id", user.id);
    updates.is_default = true;
  }

  // If adding miles (from a run), increment total_miles
  if (addMiles !== undefined) {
    const { data: currentShoe } = await supabase
      .from("shoes")
      .select("total_miles")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    
    if (currentShoe) {
      updates.total_miles = (currentShoe.total_miles || 0) + addMiles;
    }
  }

  const { data: shoe, error } = await supabase
    .from("shoes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shoe });
}

// DELETE - Remove a shoe
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Shoe ID is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("shoes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
