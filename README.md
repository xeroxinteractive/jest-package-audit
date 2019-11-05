# jest-package-audit

> Filter and retry yarn/npm audit command with Jest.

[![circleci status][circleci-badge]][circleci-link]
[![npm package][npm-badge]][npm-link]
[![license MIT][license-badge]][license]
[![commit style angular][commit-style-badge]][commit-style-link]
[![semantic-release][semantic-release-badge]][semantic-release-link]
[![tested with jest][jest-badge]][jest-link]
[![Dependabot Status][dependabot-badge]][dependabot-link]

The `yarn audit`, and `npm audit` commands are useful for detecting packages in use that have vulnerabilites. But they don't allow filtering. For example you may have a vulnerability in a package you are only using in development, and the nature of that vulnerability is more often than not only unsafe when used in production. Updating the dependency to fix the vulnerability may break things. That is where `jest-package-audit` comes in, it wraps the `yarn audit` and `npm audit` commands and checks each vulnerabilty they flag against an array of allowed vulnerability names e.g. `['puppeteer']`.

Another added benefit of `jest-package-audit` is the ability to retry tests if they fail. This is useful as the audit endpoints can sometimes timeout out or randomly give 503 HTTP Status codes back. Using [jest.retryTimes][jest-retry-times] you can overcome this by retrying say 5 times.

## Usage
__Important: `jest-package-audit` only works with Jest >= 23 as it depends on [async matchers][async-matchers].__
1. Install `jest-package-audit`:
```bash
yarn add @xerox/jest-package-audit --dev
# or
npm install @xerox/jest-package-audit --save-dev
```
2. Create a new test file for package auditing:
```javascript
// audit.test.js
import { toPassPackageAudit } from '@xerox/jest-package-audit';
expect.extend({ toPassPackageAudit });

jest.retryTimes(5); // Optional
jest.setTimeout(15000); // The audit command can take a while...

test('packages do not have vunerabilities', async () => {
  await expect({/* Input options */}).toPassPackageAudit({ allow: ['puppeteer'] /* Output options */ });
});
```

## Options
### Input Options
Input options should be passed to the `expect` function when using `toPassPackageAudit`, they define how the actual `yarn audit` or `npm audit` command is run.

Name | Description | Default
--- | --- | ---
`cwd: (String)` | Current working directory to run the audit command in. | The closest folder with a `package.json` above `jest-package-audit`.
`command (String)` | Which command to run, e.g. `yarn audit` or `npm audit` you can also pass additional options for these commands. | `yarn audit`

### Output Options
Output options should be passed to the `toPassPackageAudit` function, they define how the output of `yarn audit` or `npm audit` is processed.

Name | Description | Default
--- | --- | ---
`accept: (String[])` | An array of package names to allow if they have vulnerabilities. | `[]`

## Disclaimer
Please be aware that we provide no liability for any security issues, or any other issues for that matter, encountered when using this package. It is provided as open-source software under the MIT license. So please read the source code and make sure you understand the implications of allowing vulnerable modules to pass through the `audit` commands!

---

[LICENSE][license] | [CHANGELOG][changelog] | [ISSUES][issues]

[license]: ./LICENSE
[changelog]: ./CHANGELOG.md
[issues]: https://github.com/xeroxinteractive/jest-package-audit/issues

[circleci-badge]: https://flat.badgen.net/circleci/github/xeroxinteractive/jest-package-audit/master
[circleci-link]: https://circleci.com/gh/xeroxinteractive/jest-package-audit/tree/master

[npm-badge]: https://flat.badgen.net/npm/v/@xerox/jest-package-audit?color=cyan
[npm-link]: https://www.npmjs.com/package/@xerox/jest-package-audit

[license-badge]: https://flat.badgen.net/npm/license/@xerox/jest-package-audit

[commit-style-badge]: https://flat.badgen.net/badge/commit%20style/angular/purple
[commit-style-link]: https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines

[semantic-release-badge]: https://flat.badgen.net/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80/semantic%20release/e10079
[semantic-release-link]: https://github.com/semantic-release/semantic-release

[dependabot-badge]: https://flat.badgen.net/dependabot/xeroxinteractive/jest-package-audit?icon=dependabot
[dependabot-link]: https://dependabot.com

[jest-badge]: https://flat.badgen.net/badge/tested%20with/jest/99424f
[jest-link]: https://github.com/facebook/jest

[async-matchers]: https://jestjs.io/blog/2018/05/29/jest-23-blazing-fast-delightful-testing.html#custom-asynchronous-matchers
[jest-retry-times]: https://github.com/facebook/jest/blob/f45d1c939cbf55a71dbfdfc316d2be62b590197f/docs/JestObjectAPI.md#jestretrytimes
