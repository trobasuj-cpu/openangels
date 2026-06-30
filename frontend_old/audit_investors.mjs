import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function audit() {
  console.log("Fetching investors...");
  let all_investors = [];
  let limit = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('investors')
      .select('id, name, email, linkedin_url, twitter_url')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching data:", error);
      break;
    }

    all_investors = all_investors.concat(data);
    if (data.length < limit) break;
    offset += limit;
  }

  const total = all_investors.length;
  console.log(`Total investors fetched: ${total}\n`);

  if (total === 0) return;

  const stats = {
    ideal: 0,
    missing_email_only: 0,
    missing_linkedin_only: 0,
    missing_twitter_only: 0,
    missing_two_fields: 0,
    missing_all_three: 0,
    total_missing_email: 0,
    total_missing_linkedin: 0,
    total_missing_twitter: 0,
  };

  for (const inv of all_investors) {
    const has_email = !!(inv.email && inv.email.trim());
    const has_li = !!(inv.linkedin_url && inv.linkedin_url.trim());
    const has_tw = !!(inv.twitter_url && inv.twitter_url.trim());

    const fields_count = [has_email, has_li, has_tw].filter(Boolean).length;

    if (!has_email) stats.total_missing_email++;
    if (!has_li) stats.total_missing_linkedin++;
    if (!has_tw) stats.total_missing_twitter++;

    if (fields_count === 3) stats.ideal++;
    else if (fields_count === 2) {
      if (!has_email) stats.missing_email_only++;
      else if (!has_li) stats.missing_linkedin_only++;
      else if (!has_tw) stats.missing_twitter_only++;
    } else if (fields_count === 1) {
      stats.missing_two_fields++;
    } else {
      stats.missing_all_three++;
    }
  }

  console.log("--- АУДИТ БАЗЫ ДАННЫХ ИНВЕСТОРОВ ---");
  console.log(`Всего записей: ${total}`);
  console.log(`✅ Идеальные (есть Email, LinkedIn, Twitter): ${stats.ideal} (${(stats.ideal / total * 100).toFixed(1)}%)`);
  console.log("-".repeat(40));
  console.log("⚠️ Не хватает ровно одного поля:");
  console.log(`  - Нет Email (но есть соцсети): ${stats.missing_email_only}`);
  console.log(`  - Нет LinkedIn (но есть Email и Twitter): ${stats.missing_linkedin_only}`);
  console.log(`  - Нет Twitter (но есть Email и LinkedIn): ${stats.missing_twitter_only}`);
  console.log("-".repeat(40));
  console.log(`🚨 Не хватает двух полей: ${stats.missing_two_fields} (${(stats.missing_two_fields / total * 100).toFixed(1)}%)`);
  console.log(`🗑️ Мусорные (нет ни Email, ни LinkedIn, ни Twitter): ${stats.missing_all_three} (${(stats.missing_all_three / total * 100).toFixed(1)}%)`);
  console.log("-".repeat(40));
  console.log("Общая статистика отсутствующих полей:");
  console.log(`Всего без Email:    ${stats.total_missing_email} (${(stats.total_missing_email / total * 100).toFixed(1)}%)`);
  console.log(`Всего без LinkedIn: ${stats.total_missing_linkedin} (${(stats.total_missing_linkedin / total * 100).toFixed(1)}%)`);
  console.log(`Всего без Twitter:  ${stats.total_missing_twitter} (${(stats.total_missing_twitter / total * 100).toFixed(1)}%)`);
}

audit();
