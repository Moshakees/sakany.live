import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration variables are missing.' },
        { status: 500 }
      );
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      );
    }

    // Get the Authorization header from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is missing.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create an admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Verify the requester's token and identity
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !requester) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token.' },
        { status: 401 }
      );
    }

    // 2. Query the requester's profile to verify if they are an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role is required to perform this action.' },
        { status: 403 }
      );
    }

    // 3. Delete the target user from auth.users (which will cascade to delete the profile due to RLS/Foreign Key constraint)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration variables are missing.' },
        { status: 500 }
      );
    }

    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required.' },
        { status: 400 }
      );
    }

    // Get the Authorization header from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is missing.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create an admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Verify the requester's token and identity
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !requester) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token.' },
        { status: 401 }
      );
    }

    // 2. Query the requester's profile to verify if they are an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role is required to perform this action.' },
        { status: 403 }
      );
    }

    // 3. Update the target user's password in auth.users
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

