export enum Severity {
  INFO = 'info',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface InputOptions {
  cwd?: string;
  yarn?: boolean;
  level?: Severity;
  dependencyType?: 'devDependencies' | 'dependencies';
  command?: string;
}

export interface FilterOptions {
  packageName: string;
  packageSeverity?: string;
  packageData?: PackageJSONFields;
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
  type: string;
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

export interface YarnAuditSummaryJSONFields {
  type: string;
  data: PackageAuditSummaryDataField;
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

export interface NPMAuditAdvisoryField {
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

export interface NPMAuditAdvisoriesField {
  [key: string]: NPMAuditAdvisoryField;
}

export interface NPMAuditJSONFields {
  actions: NPMAuditActionsField[];
  advisories: NPMAuditAdvisoriesField;
  muted: unknown[];
  metadata: PackageAuditSummaryDataField;
  runId: string;
}

export type PackageJSONFields =
  | YarnAuditAdvisoryJSONFields
  | YarnAuditSummaryJSONFields
  | NPMAuditJSONFields;
