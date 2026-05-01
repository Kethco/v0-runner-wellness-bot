"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback`,
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, user: data.user };
}

export async function signIn(formData: { email: string; password: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, user: data.user };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
