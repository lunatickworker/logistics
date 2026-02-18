import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

// 싱글톤 Supabase 클라이언트 (중복 인스턴스 방지)
const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);
