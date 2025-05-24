import { createServerClient } from "./supabase"

export async function checkAuth() {
  const supabase = createServerClient()

  // For demo purposes, we'll use a simple check
  // In production, you'd want proper session management
  return true
}

export const DEFAULT_CREDENTIALS = {
  username: "admin",
  password: "iconkreatif2024",
}
