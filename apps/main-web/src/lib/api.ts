"use client";

import { createApiClient } from "@ielts/api-client";
import { supabase } from "@/lib/supabase";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/$/, "");

export const apiFetch = createApiClient(apiUrl, {
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
  refreshAccessToken: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    return error ? undefined : data.session?.access_token;
  },
});
