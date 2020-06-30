## [3.0.1](https://github.com/xeroxinteractive/jest-package-audit/compare/v3.0.0...v3.0.1) (2020-05-16)


### Bug Fixes

* add jest as peer dependency + jest 26 ([38e31ca](https://github.com/xeroxinteractive/jest-package-audit/commit/38e31ca))

# [3.0.0](https://github.com/xeroxinteractive/jest-package-audit/compare/v2.0.5...v3.0.0) (2020-03-24)


### chore

* remove xerox prefix ([573f2e5](https://github.com/xeroxinteractive/jest-package-audit/commit/573f2e5))


### BREAKING CHANGES

* `@xerox/` prefix removed from npm package going forward

## [2.0.5](https://github.com/xeroxinteractive/jest-package-audit/compare/v2.0.4...v2.0.5) (2019-12-13)

## [2.0.4](https://github.com/xeroxinteractive/jest-package-audit/compare/v2.0.3...v2.0.4) (2019-11-18)

## [2.0.3](https://github.com/xeroxinteractive/jest-package-audit/compare/v2.0.2...v2.0.3) (2019-11-05)


### Bug Fixes

* **types:** match new jest typings ([7a64df3](https://github.com/xeroxinteractive/jest-package-audit/commit/7a64df3))

## [2.0.2](https://github.com/xeroxinteractive/jest-package-audit/compare/v2.0.1...v2.0.2) (2019-08-28)


### Bug Fixes

* allow exit code 2 ([209ceb5](https://github.com/xeroxinteractive/jest-package-audit/commit/209ceb5))

## [2.0.1](https://github.com/xeroxinteractive/jest-package-audit/compare/v2.0.0...v2.0.1) (2019-07-17)


### Bug Fixes

* 16000+ vulnerabilities ([03f8b62](https://github.com/xeroxinteractive/jest-package-audit/commit/03f8b62))

# [2.0.0](https://github.com/xeroxinteractive/jest-package-audit/compare/v1.0.4...v2.0.0) (2019-07-11)


### Features

* move to xerox org ([a32e34e](https://github.com/xeroxinteractive/jest-package-audit/commit/a32e34e))


### BREAKING CHANGES

* npm module name changed from browserslist-browserstack to @xerox/browserslist-browserstack

## [1.0.4](https://github.com/xeroxinteractive/jest-package-audit/compare/v1.0.3...v1.0.4) (2019-06-19)


### Bug Fixes

* remove circleci-bin due to windows compat ([7160cbc](https://github.com/xeroxinteractive/jest-package-audit/commit/7160cbc))

## [1.0.3](https://github.com/xeroxinteractive/jest-package-audit/compare/v1.0.2...v1.0.3) (2019-05-24)


### Bug Fixes

* allow filtering + better exit code handling ([85406d7](https://github.com/xeroxinteractive/jest-package-audit/commit/85406d7))

## [1.0.2](https://github.com/xeroxinteractive/jest-package-audit/compare/v1.0.1...v1.0.2) (2019-05-23)


### Code Refactoring

* single file exports matcher ([5ac17da](https://github.com/xeroxinteractive/jest-package-audit/commit/5ac17da))


### BREAKING CHANGES

* toPassPackageAudit is no longer automatically extended onto jest, using setupFilesAfterEnv will no longer work.

## [1.0.1](https://github.com/xeroxinteractive/jest-package-audit/compare/v1.0.0...v1.0.1) (2019-05-22)


### Bug Fixes

* use cross-spawn for windows compat ([0cf82c3](https://github.com/xeroxinteractive/jest-package-audit/commit/0cf82c3))
* windows cross-spawn mocking ([219c576](https://github.com/xeroxinteractive/jest-package-audit/commit/219c576))

# 1.0.0 (2019-05-21)


### Bug Fixes

* exit code 8 ([3817c9d](https://github.com/xeroxinteractive/jest-package-audit/commit/3817c9d))
* **audit:** more timeout I guess ([4d4ec6e](https://github.com/xeroxinteractive/jest-package-audit/commit/4d4ec6e))
* **matcher:** output error in message ([464a5aa](https://github.com/xeroxinteractive/jest-package-audit/commit/464a5aa))
* **package:** v0.0.0 ([0fa7df3](https://github.com/xeroxinteractive/jest-package-audit/commit/0fa7df3))


### Features

* initial implementation ([7de24fc](https://github.com/xeroxinteractive/jest-package-audit/commit/7de24fc))
* log error if jest can’t be extended ([9e2503d](https://github.com/xeroxinteractive/jest-package-audit/commit/9e2503d))
