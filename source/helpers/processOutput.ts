import { AuditReport } from '@pnpm/audit';
import {
  InputOptionsWithPackageManager,
  OutputOptions,
  NPMReportV2JSONFields,
  PackageJSONFields,
  YarnAuditAdvisoryJSONFields,
} from 'source/static';
import severityGreater from './severityGreater';

// CLI output is very much unknown, so over-checking is probably sensible.
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

/**
 * Typeguard for yarn audit output.
 *
 * @param entry - JSON object entry.
 * @param inputOptions - Input options.
 * @returns Whether the given entry is a yarn audit result.
 */
function isYarnAudit(
  entry: unknown,
  inputOptions: InputOptionsWithPackageManager
): entry is YarnAuditAdvisoryJSONFields {
  const expectedEntry = entry as YarnAuditAdvisoryJSONFields;
  return Boolean(
    inputOptions.packageManager === 'yarn' &&
      entry &&
      typeof entry === 'object' &&
      'type' in expectedEntry &&
      typeof expectedEntry.data === 'object' &&
      'advisory' in expectedEntry.data
  );
}

/**
 * Typeguard for npm audit v1 output.
 *
 * @param entry - JSON object entry.
 * @param inputOptions - Input options.
 * @returns Whether the given entry is a npm audit v1 result.
 */
function isNPMAuditV1orPNPM(
  entry: unknown,
  inputOptions: InputOptionsWithPackageManager
): entry is AuditReport {
  const expectedEntry = entry as YarnAuditAdvisoryJSONFields;
  return Boolean(
    (inputOptions.packageManager === 'npm' ||
      inputOptions.packageManager === 'pnpm') &&
      entry &&
      typeof entry === 'object' &&
      'advisories' in expectedEntry
  );
}

/**
 * Typeguard for npm audit v2 output.
 *
 * @param entry - JSON object entry.
 * @param inputOptions - Input options.
 * @returns Whether the given entry is a npm audit v2 result.
 */
function isNPMAuditV2(
  entry: unknown,
  inputOptions: InputOptionsWithPackageManager
): entry is NPMReportV2JSONFields {
  const expectedEntry = entry as NPMReportV2JSONFields;
  return Boolean(
    inputOptions.packageManager === 'npm' &&
      entry &&
      typeof entry === 'object' &&
      'auditReportVersion' in expectedEntry &&
      expectedEntry.auditReportVersion === 2
  );
}

/**
 * Parses the CLI output, returning vulnerabilities and allowed package names.
 *
 * @param output - CLI Output.
 * @param inputOptions - Input Options.
 * @param outputOptions - Output Options.
 * @returns Vulnerabilities and allowed package names.
 */
export default function parseOutput(
  output: string,
  inputOptions: InputOptionsWithPackageManager,
  outputOptions: OutputOptions
): { vulnerabilities: string[]; allowed: string[] } {
  const outputString = output?.toString().replace(/}\s*{/g, '},{');
  const correctedOutputString = `[${outputString}]`;
  const rows = JSON.parse(correctedOutputString) as PackageJSONFields[];

  const matches = [];
  for (const row of rows) {
    if (isYarnAudit(row, inputOptions)) {
      // Process yarn audit --json.
      matches.push({
        packageName: row.data.advisory.module_name,
        packageSeverity: row.data.advisory.severity,
        packageData: row,
      });
    } else if (isNPMAuditV1orPNPM(row, inputOptions)) {
      // Process npm audit report version 1
      let name = '';
      let severity = '';
      for (const key in row.advisories) {
        const item = row.advisories[key];
        if (item?.module_name && item?.severity) {
          name = item.module_name;
          severity = item.severity;
        }
        if (name && severity) {
          matches.push({
            packageName: name,
            packageSeverity: severity,
            packageData: item,
          });
        }
      }
    } else if (isNPMAuditV2(row, inputOptions)) {
      // Process npm audit report version 2
      let name = '';
      let severity = '';
      for (const key in row.vulnerabilities) {
        const item = row.vulnerabilities[key];
        if (item?.name && item?.severity) {
          name = item.name;
          severity = item.severity;
        }
        if (name && severity) {
          matches.push({
            packageName: name,
            packageSeverity: severity,
            packageData: item,
          });
        }
      }
    }
  }

  const vulnerabilities = new Set<string>();
  const allowed = new Set<string>();

  // Loop over all the table package matches, adding vulnerabilities where appropriate.
  for (const match of matches) {
    const severity = match.packageSeverity;
    const pkg = match.packageName;
    const allowedSeverity = severityGreater(inputOptions, severity);
    if (allowedSeverity) {
      if (outputOptions && outputOptions.allow) {
        if (typeof outputOptions.allow === 'function') {
          if (outputOptions.allow(match)) {
            allowed.add(pkg);
            continue;
          } else {
            vulnerabilities.add(pkg);
            continue;
          }
        } else if (Array.isArray(outputOptions.allow)) {
          if (outputOptions.allow.includes(pkg)) {
            allowed.add(pkg);
            continue;
          } else {
            vulnerabilities.add(pkg);
            continue;
          }
        }
      }
      vulnerabilities.add(pkg);
    }
  }

  return {
    vulnerabilities: Array.from(vulnerabilities),
    allowed: Array.from(allowed),
  };
}
