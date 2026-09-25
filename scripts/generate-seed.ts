import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { guides } from '../src/data/guides';
const quote = (value: string | boolean) => typeof value === 'boolean' ? String(value) : `'${value.replaceAll("'", "''")}'`;
const columns = ['id', 'title', 'category', 'summary', 'detail', 'advice', 'icon', 'source_url', 'published'] as const;
const sql = '-- Generated from mobile/src/data/guides.ts. Run npm run seed:generate to update.\ninsert into public.guides (' + columns.join(',') + ') values\n' + guides.map(g => '(' + columns.map(c => quote(g[c])).join(',') + ')').join(',\n') + '\non conflict(id) do update set ' + columns.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(',') + ';\n';
writeFileSync('../supabase/seed.sql', sql);
const migrations = readdirSync('../supabase/migrations').filter(f => f.endsWith('.sql')).sort().map(f => readFileSync(`../supabase/migrations/${f}`, 'utf8'));
writeFileSync('../supabase/install.sql', '-- Run once in a NEW Supabase project. Includes all migrations and guide seed.\n' + migrations.join('\n') + '\n' + sql);
console.log(`Generated ${guides.length} guides`);
