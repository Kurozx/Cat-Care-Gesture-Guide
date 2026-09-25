import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL migrations and RLS isolate homes and protect ownership', async t => {
  const db = new PGlite();
  const a = '10000000-0000-4000-8000-000000000001';
  const b = '10000000-0000-4000-8000-000000000002';
  const f = '10000000-0000-4000-8000-000000000003';
  const homeA = '20000000-0000-4000-8000-000000000001';
  const homeB = '20000000-0000-4000-8000-000000000002';
  const catA = '30000000-0000-4000-8000-000000000001';
  const catB = '30000000-0000-4000-8000-000000000002';
  const logId = '40000000-0000-4000-8000-000000000001';
  async function asUser(id: string, role = 'authenticated') {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec(`set role ${role}`);
  }
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb, email text, email_confirmed_at timestamptz, encrypted_password text default 'private-password-hash');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;`);
    await db.exec(readFileSync('../supabase/migrations/202609210001_initial.sql', 'utf8'));
    await db.exec(readFileSync('../supabase/migrations/202609210002_login_rate_limit.sql', 'utf8'));
    await db.exec(readFileSync('../supabase/migrations/202609210003_admin.sql', 'utf8'));
    await db.exec(readFileSync('../supabase/migrations/202609210004_dashboard_users.sql', 'utf8'));
    await db.exec(readFileSync('../supabase/migrations/202609210005_user_passwords.sql', 'utf8'));
    await db.exec(readFileSync('../supabase/seed.sql', 'utf8'));
    for (const [id, username] of [[a, 'owner_a'], [b, 'owner_b'], [f, 'family']]) {
      await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)', [id, JSON.stringify({ username, full_name: username, role: 'admin' })]);
    }
    await t.test('registration ignores client-supplied admin role', async () => {
      assert.equal((await db.query<{ role: string }>('select role from public.cat_owners where id=$1', [a])).rows[0].role, 'user');
    });
    await t.test('dashboard registration creates a valid user profile without metadata', async () => {
      const id = '10000000-0000-4000-8000-000000000009';
      await db.query('insert into auth.users(id) values($1)', [id]);
      const row = (await db.query<{username:string;role:string}>('select username,role from public.cat_owners where id=$1', [id])).rows[0];
      assert.match(row.username, /^[a-z0-9_]{3,30}$/);
      assert.equal(row.role, 'user');
      await db.query('delete from auth.users where id=$1', [id]);
    });
    await asUser(a);
    await t.test('password mirrors are unavailable to users and application admins', async () => {
      await assert.rejects(db.query('select * from public.user_passwords'));
      await assert.rejects(db.query("select public.admin_records('user_passwords')"));
      await assert.rejects(db.query("update public.user_passwords set password_hash='forged'"));
    });
    await db.query('insert into public.homes(id,owner_id,name) values($1,$2,$3)', [homeA, a, 'บ้าน A']);
    await db.query('insert into public.cats(id,home_id,name) values($1,$2,$3)', [catA, homeA, 'มะลิ']);
    await db.query("insert into public.daily_logs(id,home_id,cat_id,reporter_id,title,behavior,level) values($1,$2,$3,$4,'หางตั้ง','หางตั้ง','low')", [logId, homeA, catA, a]);
    await t.test('owner can read inserted records and audit trail', async () => {
      assert.equal((await db.query('select * from public.home_members')).rows.length, 1);
      assert.equal((await db.query('select * from public.log_actions')).rows.length, 1);
    });
    await asUser(b);
    await db.query('insert into public.homes(id,owner_id,name) values($1,$2,$3)', [homeB, b, 'บ้าน B']);
    await db.query('insert into public.cats(id,home_id,name) values($1,$2,$3)', [catB, homeB, 'ส้ม']);
    await t.test('other home cannot read or mutate owner A data', async () => {
      assert.equal((await db.query('select * from public.daily_logs')).rows.length, 0);
      assert.equal((await db.query('select * from public.cats')).rows.length, 1);
      assert.equal((await db.query('select * from public.log_actions')).rows.length, 0);
      assert.equal((await db.query("update public.daily_logs set note='stolen' where id=$1 returning id", [logId])).rows.length, 0);
      await assert.rejects(db.query("insert into public.daily_logs(home_id,cat_id,reporter_id,title,behavior,level) values($1,$2,$3,'x','x','low')", [homeA, catA, b]));
      await assert.rejects(db.query("select public.add_family_member($1,'family')", [homeA]));
    });
    await asUser(a);
    await t.test('roles, reporters and foreign keys are protected', async () => {
      await assert.rejects(db.query("update public.cat_owners set role='admin' where id=$1", [a]));
      await assert.rejects(db.query('update public.homes set owner_id=$1 where id=$2', [b, homeA]));
      await assert.rejects(db.query('update public.daily_logs set reporter_id=$1 where id=$2', [b, logId]));
      await assert.rejects(db.query("insert into public.daily_logs(home_id,cat_id,reporter_id,title,behavior,level) values($1,$2,$3,'x','x','low')", [homeA, catB, a]));
      await assert.rejects(db.query("insert into public.daily_logs(home_id,cat_id,reporter_id,title,behavior,level) values($1,$2,$3,'x','x','low')", [homeA, catA, b]));
      await assert.rejects(db.query("update public.daily_logs set occurred_at=now()+interval '1 day' where id=$1", [logId]));
      await assert.rejects(db.query("insert into public.log_actions(log_id,observer_id,behavior_note) values($1,$2,'forged')", [logId, a]));
    });
    await db.query("select public.add_family_member($1,'family')", [homeA]);
    await asUser(f);
    await t.test('family sees shared data and can edit but cannot delete owner log or manage cats', async () => {
      assert.equal((await db.query('select * from public.daily_logs')).rows.length, 1);
      assert.equal((await db.query('select * from public.cat_owners')).rows.length, 2);
      await db.query("update public.daily_logs set note='family note',status='follow_up' where id=$1", [logId]);
      assert.equal((await db.query('select * from public.log_actions')).rows.length, 2);
      assert.equal((await db.query('delete from public.daily_logs where id=$1 returning id', [logId])).rows.length, 0);
      assert.equal((await db.query("update public.cats set name='changed' where id=$1 returning id", [catA])).rows.length, 0);
      await assert.rejects(db.query('insert into public.home_members values($1,$2)', [homeA, b]));
    });
    await asUser(a); await db.query('select public.remove_family_member($1,$2)', [homeA, f]);
    await asUser(f);
    await t.test('revoking family access immediately hides records', async () => {
      assert.equal((await db.query('select * from public.daily_logs')).rows.length, 0);
      assert.equal((await db.query('select * from public.cats')).rows.length, 0);
      assert.equal((await db.query('select * from public.log_actions')).rows.length, 0);
    });
    await asUser('', 'anon');
    await t.test('guest reads public guides only', async () => {
      assert.equal((await db.query('select * from public.guides')).rows.length, 8);
      await assert.rejects(db.query('select * from public.cat_owners'));
      await assert.rejects(db.query("update public.guides set title='hacked'"));
      await assert.rejects(db.query("select public.check_login_rate(repeat('a',64))"));
    });
    await asUser('', 'service_role');
    await t.test('login rate limit is server-only and bounds attempts', async () => {
      assert.equal((await db.query('select id from public.cat_owners where username=$1', ['owner_a'])).rows.length, 1);
      for (let i = 0; i < 10; i++) assert.equal((await db.query<{ allowed: boolean }>("select public.check_login_rate(repeat('a',64)) as allowed")).rows[0].allowed, true);
      assert.equal((await db.query<{ allowed: boolean }>("select public.check_login_rate(repeat('a',64)) as allowed")).rows[0].allowed, false);
    });
    await asUser(a);
    await t.test('users cannot call admin RPCs or forge their role', async () => {
      await assert.rejects(db.query("select public.admin_records('cat_owners')"));
      await assert.rejects(db.query("select public.admin_save_record('guides',null,'{}')"));
      await assert.rejects(db.query("select public.admin_update_user($1,'X','','admin')", [a]));
      await assert.rejects(db.query("select public.admin_delete_record('cats',$1,'DELETE')", [catB]));
    });
    await db.exec('reset role');
    await db.query("update public.cat_owners set role='admin' where id=$1", [a]);
    await asUser(a);
    await t.test('admin CRUD works across homes and records every change', async () => {
      assert.equal((await db.query<{data:any[]}>("select public.admin_records('cats') as data")).rows[0].data.length,2);
      const created = (await db.query<{data:any}>("select public.admin_save_record('cats',null,$1) as data", [JSON.stringify({home_id:homeB,name:'Admin cat'})])).rows[0].data;
      await db.query("select public.admin_save_record('cats',$1,$2)", [created.id,JSON.stringify({name:'Renamed'})]);
      await assert.rejects(db.query("select public.admin_save_record('cats',$1,$2)", [created.id,JSON.stringify({home_id:homeA})]));
      await assert.rejects(db.query("select public.admin_save_record('auth.users',null,'{}')"));
      await assert.rejects(db.query("select public.admin_delete_record('cats',$1,'wrong')", [created.id]));
      await db.query("select public.admin_delete_record('cats',$1,'DELETE')", [created.id]);
      assert.equal((await db.query('select * from public.admin_actions')).rows.length,3);
    });
    await t.test('admin can edit users but cannot remove or demote self', async () => {
      const listed = (await db.query<{data: any[]}>("select public.admin_records('cat_owners') as data")).rows[0].data;
      assert.equal(listed.length, 3);
      assert.ok(listed.every(row => !('encrypted_password' in row) && !('password' in row)));
      await db.query("select public.admin_update_user($1,'Edited','','admin')", [f]);
      await assert.rejects(db.query("select public.admin_update_user($1,'Self','','user')", [a]));
      await assert.rejects(db.query("select public.admin_delete_record('cat_owners',$1,'DELETE')", [a]));
      await assert.rejects(db.query("select public.admin_delete_record('cat_owners',$1,'DELETE')", [b]));
      await db.query("select public.admin_update_user($1,'Edited','','user')", [f]);
      await asUser(f);
      await assert.rejects(db.query("select public.admin_records('cat_owners')"));
    });
    await db.exec('reset role');
    const disposableUser = '10000000-0000-4000-8000-000000000004';
    await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)', [disposableUser,JSON.stringify({ username:'disposable_user',full_name:'Disposable' })]);
    await asUser(a);
    await t.test('admin can delete an empty account and its profile', async () => {
      await db.query("select public.admin_delete_record('cat_owners',$1,'DELETE')", [disposableUser]);
      assert.equal((await db.query('select id from public.cat_owners where id=$1',[disposableUser])).rows.length,0);
    });
    await asUser('', 'anon');
    await t.test('anonymous callers cannot execute admin functions', async () => {
      await assert.rejects(db.query("select public.admin_records('guides')"));
    });
    await db.exec('reset role');
    await t.test('password mirror follows Auth updates and account deletion', async () => {
      assert.equal((await db.query<{password_hash:string}>('select password_hash from public.user_passwords where user_id=$1',[a])).rows[0].password_hash,'private-password-hash');
      await db.query("update auth.users set encrypted_password='updated-test-hash' where id=$1",[a]);
      assert.equal((await db.query<{password_hash:string}>('select password_hash from public.user_passwords where user_id=$1',[a])).rows[0].password_hash,'updated-test-hash');
      assert.equal((await db.query('select user_id from public.user_passwords where user_id=$1',[disposableUser])).rows.length,0);
    });
  } finally { await db.close(); }
});

