// lib/Auth.ts
import { supabase } from '@/utils/supabaseClient';
import domains from 'disposable-email-domains';

const disposableDomains = new Set(domains);

export async function signUp(email: string, password: string, fullName: string, mobile?: string) {
  // Check for disposable email domain
  const emailDomain = email.split('@')[1];
  if (disposableDomains.has(emailDomain)) {
    return { data: null, error: { message: "Disposable email addresses are not allowed." } };
  }

  // Check for blocked mobile number
  const { data: blockedUser, error: blockedError } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('mobile_number', mobile)
    .single();

  if (blockedUser) {
    return { data: null, error: { message: "This mobile number has been blocked." } };
  }

  // If checks pass, proceed with signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    console.error("Supabase Auth Sign Up Error:", error.message, error);
  }

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (data.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      console.log('No profile found, creating a new one...');
      const { error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: data.user.user_metadata.full_name || null,
        });

      if (newProfileError) {
        console.error('Error creating new profile on login:', newProfileError);
      }
    } else if (profileError) {
      console.error('Error fetching profile:', profileError);
    }
  }

  return { data, error };
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
  });

  return { error };
}

export async function updateProfile(userId: string, fullName: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error.message);
  }

  return { data, error };
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}