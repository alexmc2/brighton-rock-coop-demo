'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createProjectReport({
  projectId,
  title,
  content,
}: {
  projectId: string;
  title: string;
  content: string;
}) {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.from('garden_project_reports').insert({
    project_id: projectId,
    title,
    content,
    created_by: user.id,
    last_modified_by: user.id,
  }).select(`
      *,
      created_by_user:profiles!created_by(*),
      last_modified_by_user:profiles!last_modified_by(*)
    `);

  if (error) {
    throw error;
  }

  revalidatePath(`/members/garden/projects/${projectId}`);
  return { success: true, report: data[0] };
}

export async function getProjectReports(projectId: string) {
  const supabase = createServerActionClient({ cookies });

  const { data, error } = await supabase
    .from('garden_project_reports')
    .select(
      `
      *,
      created_by_user:profiles!created_by(*),
      last_modified_by_user:profiles!last_modified_by(*)
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProjectReport({
  reportId,
  title,
  content,
}: {
  reportId: string;
  title: string;
  content: string;
}) {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('garden_project_reports')
    .update({
      title,
      content,
      last_modified_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId).select(`
      *,
      created_by_user:profiles!created_by(*),
      last_modified_by_user:profiles!last_modified_by(*)
    `);

  if (error) {
    throw error;
  }

  const report = data[0];
  revalidatePath(`/members/garden/projects/${report.project_id}`);
  return { success: true, report };
}

export async function deleteProjectReport({
  reportId,
  projectId,
}: {
  reportId: string;
  projectId: string;
}) {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('garden_project_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    throw error;
  }

  revalidatePath(`/members/garden/projects/${projectId}`);
  return { success: true };
}
