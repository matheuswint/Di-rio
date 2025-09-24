import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yrlnqpugyrukjurtqpem.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybG5xcHVneXJ1a2p1cnRxcGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzkwMzIsImV4cCI6MjA3NDMxNTAzMn0.YVslTFhe1_JXy-Irpaet6Wb8Gxt4ucFMIEsW0sZDVjA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);