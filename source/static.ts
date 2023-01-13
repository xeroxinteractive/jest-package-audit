import { AuditReport } from '@pnpm/audit';

export enum Severity {
  INFO = 'info',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const supportedPackageManagers = ['npm', 'yarn', 'pnpm'] as const;

/**
 * Typeguard for supported package managers.
 *
 * @param packageManager - Package manager name to check.
 * @returns Whether the given package manager is supported.
 */
export function isSupportedPackageManager(
  packageManager: string | null | undefined
): packageManager is (typeof supportedPackageManagers)[number] {
  // includes() requires the type to only match, which obviously it doesn't.
  return Boolean(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    packageManager && supportedPackageManagers.includes(packageManager as any)
  );
}

export interface InputOptions {
  cwd?: string;
  packageManager?: (typeof supportedPackageManagers)[number];
  level?: Severity;
  dependencyType?: 'devDependencies' | 'dependencies';
  command?: string;
}

export interface InputOptionsWithPackageManager {
  cwd?: string;
  packageManager: (typeof supportedPackageManagers)[number];
  level?: Severity;
  dependencyType?: 'devDependencies' | 'dependencies';
  command?: string;
}

export interface FilterOptions {
  packageName: string;
  packageSeverity?: Severity | string;
  packageData?:
    | YarnAuditAdvisoryJSONFields
    | NPMReportV2Vulnerability
    | AuditReport['advisories'][number];
}

export interface OutputOptions {
  allow?: string[] | ((options: FilterOptions) => boolean);
}

export interface YarnAuditAdvisoryResolutionField {
  id: number;
  path: string;
  dev: boolean;
  optional: boolean;
  bundled: boolean;
}

export interface PackageAuditAdvisoryFindingsField {
  version: string;
  paths: string[];
}

export interface PackageAuditAdvisoryFoundByField {
  link: string;
  name: string;
  email: string;
}

export interface PackageAuditAdvisoryMetadataField {
  module_type: string;
  exploitability: number;
  affected_components: string;
}

export interface YarnAuditAdvisoryAdvisoryField {
  findings: PackageAuditAdvisoryFindingsField[];
  id: number;
  created: string;
  updated: string;
  deleted: string | null;
  title: string;
  found_by: PackageAuditAdvisoryFoundByField;
  reported_by: PackageAuditAdvisoryFoundByField;
  module_name: string;
  cves: unknown[];
  vulnerable_versions: string;
  patched_versions: string;
  overview: string;
  recommendation: string;
  references: string;
  access: string;
  severity: string;
  cwe: string;
  metadata: PackageAuditAdvisoryMetadataField;
  url: string;
}

export interface YarnAuditAdvisoryDataField {
  resolution: YarnAuditAdvisoryResolutionField;
  advisory: YarnAuditAdvisoryAdvisoryField;
}

export interface YarnAuditAdvisoryJSONFields {
  type: 'auditAdvisory';
  data: YarnAuditAdvisoryDataField;
}

export interface PackageAuditSummaryVulnerabilitiesField {
  info: number;
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

export interface PackageAuditSummaryDataField {
  vulnerabilities: PackageAuditSummaryVulnerabilitiesField;
  dependencies: number;
  devDependencies: number;
  optionalDependencies: number;
  totalDependencies: number;
}

export interface NPMAuditActionsResolvesField {
  id: number;
  path: string;
  dev: boolean;
  optional: boolean;
  bundled: boolean;
}

export interface NPMAuditActionsField {
  isMajor: boolean;
  action: string;
  resolves: NPMAuditActionsResolvesField[];
  module: string;
  target: string;
}

export interface NPMReportV2Metadata {
  vulnerabilities: {
    info: number;
    low: number;
    moderate: number;
    high: number;
    critical: number;
    total: number;
  };
  dependencies: {
    prod: number;
    dev: number;
    optional: number;
    peer: number;
    peerOptional: number;
    total: number;
  };
}

export interface NPMReportV2Advisory {
  source: string;
  name: string;
  dependency: string;
  title: string;
  url: string;
  severity: Severity;
  range: string;
}

export interface NPMReportV2Vulnerability {
  name: string;
  severity: Severity;
  isDirect: boolean;
  via: NPMReportV2Advisory[];
  effects: unknown[];
  range: string;
  nodes: string[];
  fixAvailable?: {
    name: string;
    version: string;
    isSemVerMajor: boolean;
  };
}

export interface NPMReportV2AdvisoriesField {
  [key: string]: NPMReportV2Vulnerability;
}

export interface NPMReportV2JSONFields {
  auditReportVersion: 2;
  vulnerabilities: NPMReportV2AdvisoriesField;
  metadata: NPMReportV2Metadata;
}

export type PackageJSONFields =
  | YarnAuditAdvisoryJSONFields
  | NPMReportV2JSONFields
  | AuditReport;
