import { InputOptions, OutputOptions } from 'source';
import { PackageJSONFields } from 'source/static';
import severityGreater from './severityGreater';

// CLI output is very much unknown, so over-checking is probably sensible.
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

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
  inputOptions: InputOptions,
  outputOptions: OutputOptions
): { vulnerabilities: string[]; allowed: string[] } {
  const outputString = output?.toString().replace(/}\s*{/g, '},{');
  const correctedOutputString = `[${outputString}]`;
  const rows = JSON.parse(correctedOutputString) as PackageJSONFields[];

  const matches = [];
  for (const row of rows) {
    if (
      row &&
      'type' in row &&
      row.type === 'auditAdvisory' &&
      'advisory' in row.data
    ) {
      // Process yarn audit --json.
      matches.push({
        packageName: row.data.advisory.module_name,
        packageSeverity: row.data.advisory.severity,
        packageData: row,
      });
    } else if (row && 'advisories' in row) {
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
    } else if (
      row &&
      'auditReportVersion' in row &&
      row.auditReportVersion === 2
    ) {
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
