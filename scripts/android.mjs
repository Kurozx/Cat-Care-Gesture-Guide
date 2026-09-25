import { existsSync, readFileSync } from 'node:fs';
import { join, delimiter } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const env = { ...process.env };
if (process.platform === 'win32') {
  const candidates = [env.JAVA_HOME, join(env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'jbr')];
  const javaHome = candidates.find(home => {
    if (!home || !existsSync(join(home, 'bin', 'javac.exe'))) return false;
    try { return Number(readFileSync(join(home, 'release'), 'utf8').match(/JAVA_VERSION="(\d+)/)?.[1]) >= 17; }
    catch { return false; }
  });
  if (!javaHome) throw new Error('Android build requires JDK 17 or later. Set JAVA_HOME to your JDK folder.');
  env.JAVA_HOME = javaHome;
  const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') || 'Path';
  env[pathKey] = join(javaHome, 'bin') + delimiter + (env[pathKey] || '');
  if (!env.ANDROID_HOME && env.LOCALAPPDATA) {
    const sdk = join(env.LOCALAPPDATA, 'Android', 'Sdk');
    if (existsSync(sdk)) env.ANDROID_HOME = sdk;
  }
  console.log(`Android build JAVA_HOME: ${javaHome}`);
}
const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'run:android', ...process.argv.slice(2)], { env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
