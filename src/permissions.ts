import * as path from 'path';
import * as fs from 'fs/promises';
import * as cheerio from 'cheerio';

/// Android permissions source.
const URL: string = 'https://developer.android.com/reference/kotlin/android/Manifest.permission';

/// Cached permissions path.
const cacheFilePath: string = path.join('asset', 'permissions.json');

export async function getPermissions(extensionPath: string): Promise<{ label: string; code: string; }[]> {
    const data = await readCachedPermissions(extensionPath);
    return JSON.parse(data).map((e: String) => {
        return { label: e, code: `<uses-permission android:name="android.permission.${e}"/>` };
    });
}

export async function fetchPermissions() {
  try {
    const response = await fetch(URL);
    const body = await response.text();

    const $ = cheerio.load(body);
    const permissionTable = $('#constants');

    // Extract all permission names from the permissions Table.
    const allPermissions = new Set<string>();
    permissionTable.find('code').each((_, element) => {
      const permission = $(element).text().trim();
      if (permission && permission === permission.toUpperCase()) {
        allPermissions.add(permission);
      }
    });

    const permissionsArray = Array.from(allPermissions).sort();
    await compareDiff(permissionsArray);

    await fs.writeFile(cacheFilePath, JSON.stringify(permissionsArray, null, 2));
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

/**
 * Pass the extension path only if you will read cached
 * permissions inside the installed extension; 
 * otherwise, leave it empty.
*/
async function readCachedPermissions(extensionPath: string = ''): Promise<string> {
  const jsonFilePath = path.join(extensionPath, 'asset', 'permissions.json');
  return await fs.readFile(jsonFilePath, 'utf8');
}

/** Compares fetched permissions with cached ones
 * and prints any differences. 
*/
async function compareDiff(permissions: Array<string>): Promise<void> {
  if (!(await isFileExists(cacheFilePath))) { return; }

  const cachedPermissions = await readCachedPermissions();
  const diff = permissions.filter(permission => !cachedPermissions.includes(permission));

  if (diff.length > 0) {
    console.log('Newly added permissions:', diff, '\n');
  } else {
    console.log('No new permissions\n');
  }
}

async function isFileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}