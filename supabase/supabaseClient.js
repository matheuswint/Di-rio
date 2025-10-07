import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gkygamyaeurvjslhlvgt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreWdhbXlhZXVydmpzbGhsdmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjE4NzAsImV4cCI6MjA3NTQzNzg3MH0.DBvZNihyW67GIpFb0W1BgnoXJWTvd2e6p15JUF4zvQ0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
