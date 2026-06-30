import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zjdnzipqdacvlcvfjdxb.supabase.co";
const supabaseKey = "sb_publishable_SwCgMI_lBgks7TCBWJBJvg_DZdmE7Qo";

export const supabase = createClient(supabaseUrl, supabaseKey);
