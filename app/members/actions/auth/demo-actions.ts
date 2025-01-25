'use server';

import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Helper function to clean up old demo users (older than 2 days)
export async function cleanupOldDemoUsers() {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // List all users and filter for demo users
    const { data: users, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const oldDemoUsers = users.users.filter(
      (user) =>
        user.user_metadata?.is_demo && new Date(user.created_at) < twoDaysAgo
    );

    if (oldDemoUsers.length === 0) return;

    // Delete their profiles first
    for (const user of oldDemoUsers) {
      await supabaseAdmin.from('demo_profiles').delete().eq('id', user.id);

      // Then delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    console.error('Error cleaning up old demo users:', error);
  }
}

export async function createAndSignInDemoUser() {
  try {
    // Clean up old demo users first
    await cleanupOldDemoUsers();

    // Generate unique demo credentials
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueEmail = `demo+${timestamp}${randomSuffix}@brighton-rock.org`;
    const demoPassword = `Demo${timestamp}${randomSuffix}!`;
    const demoName = 'Demo User';

    // Create user with admin client
    const { data: userData, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: uniqueEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          is_demo: true,
          created_at: new Date().toISOString(),
          display_email: 'demo@brighton-rock.org',
          display_name: demoName,
        },
      });

    if (createUserError) throw createUserError;
    if (!userData.user) throw new Error('Failed to create user');

    // Create profile record in demo_profiles with unique email
    const { error: profileError } = await supabaseAdmin
      .from('demo_profiles')
      .insert({
        id: userData.user.id,
        email: uniqueEmail, // Use unique email to avoid conflicts
        full_name: demoName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      throw profileError;
    }

    // Sign in with the new credentials using the client
    const supabase = createServerComponentClient({ cookies });
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: uniqueEmail,
        password: demoPassword,
      });

    if (signInError) throw signInError;
    if (!signInData.session) throw new Error('No session returned');

    revalidatePath('/members/login');
    return {
      success: true,
      error: null,
      session: signInData.session,
    };
  } catch (error) {
    console.error('Error creating demo user:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create demo user',
      session: null,
    };
  }
}
