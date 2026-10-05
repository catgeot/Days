import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import featureMap from './feature-map.json' with { type: 'json' };
import {
  buildCauseKey,
  classifyReasonCode,
  koreanReason,
  logPrivateDetail,
} from './reason-codes.mjs';
import { maskPrivate } from './mask-private.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LAYER_LABEL = {
  smoke: 'Smoke',
  pages: 'Pages',
  e2e: 'E2E',
  ci: 'CI',
};

function resolveFeatureSmoke(id) {
  const name = featureMap.smoke?.[id];
  if (name) return name;
  console.warn(`[summarize] 기능 미지정(${id}) — feature-map.json smoke 키 추가 필요`);
  return `기능 미지정(${id})`;
}

function resolveFeatureSpec(specFile) {
  const base = path.basename(specFile);
  const name = featureMap.spec?.[base];
  if (name) return name;
  console.warn(`[summarize] 기능 미지정(${base}) — feature-map.json spec 키 추가 필요`);
  return `기능 미지정(${base})`;
}

function appendStepSummary(line) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) {
    console.log(maskPrivate(`[step-summary] ${line}`));
    return;
  }
  fs.appendFileSync(summaryFile, `${line}\n`, 'utf8');
}

function smokeCheckToResult(layer, check, source) {
  const reasonCode = classifyReasonCode(check.detail);
  let status = 'pass';
  if (check.status === 'fail') status = 'fail';
  else if (check.status === 'warn') status = 'warn';
  else if (check.status === 'skip') status = 'pass';

  if (status === 'fail' && check.detail) {
    logPrivateDetail(check.id, check.detail);
  }

  return {
    id: check.id,
    feature: resolveFeatureSmoke(check.id),
    status,
    reasonCode,
    reason: koreanReason(reasonCode),
    causeKey: buildCauseKey(layer, check.id, reasonCode),
    source,
    privateDetail: status === 'fail' ? String(check.detail || '') : undefined,
  };
}

function walkPlaywrightSuites(suites, fileStack = [], out = []) {
  if (!Array.isArray(suites)) return out;
  for (const suite of suites) {
    const nextFiles = suite.file ? [...fileStack, suite.file] : fileStack;
    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        const specFile = spec.file || nextFiles[nextFiles.length - 1] || 'unknown.spec.js';
        const specTitle = spec.title || 'test';
        if (!Array.isArray(spec.tests)) continue;
        for (const test of spec.tests) {
          const testTitle = test.title || specTitle;
          const status = test.status || test.results?.[0]?.status;
          let mapped = 'pass';
          if (status === 'flaky') mapped = 'flaky';
          else if (
            status === 'failed' ||
            status === 'timedOut' ||
            status === 'unexpected' ||
            status === 'fail'
          ) {
            mapped = 'fail';
          } else if (status === 'skipped' || status === 'interrupted') {
            mapped = 'pass';
          }

          const errMsg =
            test.results?.find((r) => r.error)?.error?.message ||
            test.results?.[0]?.error?.message ||
            testTitle;

          const reasonCode = classifyReasonCode(errMsg);
          if (mapped === 'fail') logPrivateDetail(path.basename(specFile), errMsg);
          const relSpec = specFile.replace(/^e2e\//, 'e2e/');
          out.push({
            id: path.basename(specFile),
            matchId: path.basename(specFile),
            specTitle: testTitle,
            specFile: path.basename(specFile),
            feature: resolveFeatureSpec(specFile),
            status: mapped,
            reasonCode,
            reason: koreanReason(reasonCode),
            causeKey:
              mapped === 'flaky'
                ? `flaky:${path.basename(specFile)}:${slugTitle(testTitle)}`
                : buildCauseKey('pages', path.basename(specFile), reasonCode),
            source: relSpec.startsWith('e2e/') ? relSpec : `e2e/${path.basename(specFile)}`,
            privateDetail: mapped === 'fail' ? String(errMsg || '') : undefined,
          });
        }
      }
    }
    if (Array.isArray(suite.suites)) {
      walkPlaywrightSuites(suite.suites, nextFiles, out);
    }
  }
  return out;
}

function slugTitle(title) {
  return String(title)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u3131-\uD79D-]+/g, '')
    .slice(0, 40) || 'test';
}

export function parsePlaywrightJson(report, layer) {
  const raw = typeof report === 'string' ? JSON.parse(report) : report;
  const rows = walkPlaywrightSuites(raw.suites || []);
  return rows.map((row) => {
    const layerPrefix = layer === 'e2e' ? 'e2e' : layer;
    if (row.status === 'flaky') {
      return {
        ...row,
        causeKey: `flaky:${row.specFile}:${slugTitle(row.specTitle)}`,
      };
    }
    const reasonCode = row.reasonCode;
    return {
      ...row,
      causeKey: buildCauseKey(layerPrefix, row.specFile, reasonCode),
    };
  });
}

export function parseSmokeJson(summary, layer, source = 'scripts/smoke-health.mjs') {
  const data = typeof summary === 'string' ? JSON.parse(summary) : summary;
  const checks = Array.isArray(data.checks) ? data.checks : [];
  return checks.map((c) => smokeCheckToResult(layer, c, source));
}

export function buildHealthResult({ layer, runUrl, sha, results }) {
  return {
    layer,
    runUrl: runUrl || '',
    sha: sha || '',
    results,
  };
}

export function writeSummaryLines(layer, results) {
  const label = LAYER_LABEL[layer] || layer;
  const fails = results.filter((r) => r.status === 'fail');
  const flakies = results.filter((r) => r.status === 'flaky');

  if (fails.length === 0 && flakies.length === 0) {
    appendStepSummary(`✅ [${label}] 전 항목 정상`);
    return;
  }

  for (const row of fails) {
    appendStepSummary(`❌ [${row.feature}] ${row.reason} — ${row.source}`);
  }
  for (const row of flakies) {
    appendStepSummary(`🔁 [${row.feature}] 재시도 후 통과(flaky) — ${row.specTitle || row.source}`);
  }
}

export function maybeSimulateFailure(results) {
  const flag = process.env.HEALTH_SIMULATE_FAILURE;
  if (flag !== 'true' && flag !== '1') return results;
  return [
    ...results,
    {
      id: 'SIM-1',
      feature: '모의 실패',
      status: 'fail',
      reasonCode: 'unknown',
      reason: koreanReason('unknown'),
      causeKey: 'smoke:SIM-1:unknown',
      source: 'scripts/health/summarize.mjs',
    },
  ];
}

export function maybeEmitSimPassSmoke(layer, results) {
  if (layer !== 'smoke') return results;
  const flag = process.env.HEALTH_SIMULATE_FAILURE;
  if (flag === 'true' || flag === '1') return results;
  if (results.some((r) => r.id === 'SIM-1')) return results;
  return [
    ...results,
    {
      id: 'SIM-1',
      feature: '모의 실패',
      status: 'pass',
      reasonCode: 'unknown',
      reason: koreanReason('unknown'),
      causeKey: 'smoke:SIM-1:unknown',
      source: 'scripts/health/summarize.mjs',
    },
  ];
}

export function runSummarize(options) {
  const {
    layer,
    smokePath,
    playwrightPath,
    outPath = 'health/health-result.json',
    runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : '',
    sha = process.env.GITHUB_SHA || '',
  } = options;

  let results = [];

  if (smokePath) {
    const raw = fs.readFileSync(smokePath, 'utf8');
    const json = JSON.parse(raw);
    results = parseSmokeJson(json, layer);
  }

  if (playwrightPath) {
    const raw = fs.readFileSync(playwrightPath, 'utf8');
    results = parsePlaywrightJson(JSON.parse(raw), layer);
  }

  results = maybeSimulateFailure(results);
  results = maybeEmitSimPassSmoke(layer, results);

  const publicResults = results.map(({ privateDetail, ...rest }) => rest);
  const payload = buildHealthResult({ layer, runUrl, sha, results: publicResults });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  writeSummaryLines(layer, publicResults);
  return payload;
}

function parseArgs(argv) {
  const args = { layer: 'smoke', smokePath: null, playwrightPath: null, outPath: 'health/health-result.json' };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--layer' && argv[i + 1]) {
      args.layer = argv[++i];
    } else if (a === '--smoke' && argv[i + 1]) {
      args.smokePath = argv[++i];
    } else if (a === '--playwright' && argv[i + 1]) {
      args.playwrightPath = argv[++i];
    } else if (a === '--out' && argv[i + 1]) {
      args.outPath = argv[++i];
    }
  }
  return args;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const cli = parseArgs(process.argv);
  if (!cli.smokePath && !cli.playwrightPath) {
    console.error('usage: summarize.mjs --layer smoke|pages|e2e --smoke path | --playwright path');
    process.exit(2);
  }
  runSummarize(cli);
}
