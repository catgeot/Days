import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const koPath = path.join(fileURLToPath(new URL('.', import.meta.url)), '../src/i18n/locales/ko.json');
const ko = JSON.parse(fs.readFileSync(koPath, 'utf8'));

/** SSOT `mooni.lines.intro` (ko) — Playwright assertion용 */
export const MOONI_INTRO_LINES_KO = ko.mooni.lines.intro;