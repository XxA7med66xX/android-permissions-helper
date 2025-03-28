import * as path from 'path';
import * as fs from 'fs/promises';
import * as cheerio from 'cheerio';

/// Android permissions source.
const URL: string = 'https://developer.android.com/reference/kotlin/android/Manifest.permission';

export async function getPermissions(extensionPath: string): Promise<{ label: string; code: string; }[]> {
    const jsonFilePath = path.join(extensionPath, 'asset', 'permissions.json');
    const data = await fs.readFile(jsonFilePath, 'utf8');
    return JSON.parse(data).map((e: String) => {
        return { label: e, code: `<uses-permission android:name="android.permission.${e}"/>` };
    });
}

export async function fetchPermissions() {
  const cacheFilePath = path.join('asset', 'permissions.json');

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

    await fs.writeFile(cacheFilePath, JSON.stringify(permissionsArray, null, 2));
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

