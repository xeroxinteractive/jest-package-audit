# jest-package-audit

> Filter and retry yarn/npm audit command with Jest.

[![ci status][ci-badge]][ci-link]
[![npm package][npm-badge]][npm-link]
[![license MIT][license-badge]][license]
[![auto][auto-badge]][auto-link]
[![tested with jest][jest-badge]][jest-link]

The `yarn audit`, and `npm audit` commands are useful for detecting packages in use that have vulnerabilites. But they don't allow specific package filtering. For example you may have a vulnerability in a package you are only using in development, and the nature of that vulnerability is more often than not only unsafe when used in production. Updating the dependency to fix the vulnerability may break things. That is where `jest-package-audit` comes in, it wraps the `yarn audit` and `npm audit` commands and checks each vulnerabilty they flag against an array of allowed vulnerability names e.g. `['puppeteer']`.

Another added benefit of `jest-package-audit` is the ability to retry tests if they fail. This is useful as the audit endpoints can sometimes timeout out or randomly give 503 HTTP Status codes back. Using [jest.retryTimes][jest-retry-times] you can overcome this by retrying say 5 times.

## Usage
__Important: `jest-package-audit` only works with Jest >= 23 as it depends on [async matchers][async-matchers].__
1. Install `jest-package-audit`:
```bash
yarn add jest-package-audit --dev
# or
npm install jest-package-audit --save-dev
```
2. Create a new test file for package auditing:
```javascript
// audit.test.js
import { toPassPackageAudit } from 'jest-package-audit';
expect.extend({ toPassPackageAudit });

jest.retryTimes(5); // Optional
jest.setTimeout(15000); // The audit command can take a while...

test('packages do not have vunerabilities', async () => {
  await expect({/* Input options */}).toPassPackageAudit({ allow: ['puppeteer'] /* Output options */ });
});

test('packages do not have vunerabilities using predicate function', async () => {
  await expect({/* Input options */}).toPassPackageAudit({ allow: (options) => {
    if (options.packageName === 'puppeteer' && options.packageSeverity === 'low') {
      return true;
    } else {
      return false;
    }
  } /* Output options */ });
});
```

## Options
### Input Options
Input options should be passed to the `expect` function when using `toPassPackageAudit`, they define how the actual `yarn audit` or `npm audit` command is run.

Name | Description | Default
--- | --- | ---
`cwd: (String)` | Current working directory to run the audit command in. | The closest folder with a `package.json` above `jest-package-audit`.
`yarn: (Boolean)` | Whether to use `yarn audit` instead of `npm audit`. | `true` if yarn.lock exists otherwise `false`
`level: ('info' or 'low' or 'moderate' or 'high' or 'critical')` | Limit the vulnerabilities to the given level and above. (Note: npm does not support `info`, so it will not be passed forward) |
`dependencyType: ('dependencies' or 'devDependencies')` | Limit the vulnerabilities to the projects development or production dependencies. |
`command (String)` | Custom command to use. This will override the `yarn`, `level` and `dependencyType` options. __Use this with caution!__ |

Note: `level` and `dependencyType` are passed forward to `yarn` and `npm` in their respective formats. Unless, `command` is specified,


### Output Options
Output options should be passed to the `toPassPackageAudit` function, they define how the output of `yarn audit` or `npm audit` is processed.

Name | Description | Default
--- | --- | ---
<code>allow: (String[] &#124; (vulnerability: {packageName: string; packageSeverity: string; packageData: Object}) => boolean)</code> | An array of package names to allow if they have vulnerabilities or a single callback predicate function. | `[]`

## Disclaimer
Please be aware that we provide no liability for any security issues, or any other issues for that matter, encountered when using this package. It is provided as open-source software under the MIT license. So please read the source code and make sure you understand the implications of allowing vulnerable modules to pass through the `audit` commands!

---

[LICENSE][license] | [CHANGELOG][changelog] | [ISSUES][issues] | [CONTRIBUTING][contributing]

[license]: ./LICENSE
[changelog]: ./CHANGELOG.md
[issues]: https://github.com/xeroxinteractive/jest-package-audit/issues
[contributing]: ./CONTRIBUTING.md

[ci-badge]: https://flat.badgen.net/github/checks/xeroxinteractive/jest-package-audit/release?label=ci
[ci-link]: https://github.com/xeroxinteractive/jest-package-audit/actions?query=branch%3Arelease

[npm-badge]: https://flat.badgen.net/npm/v/jest-package-audit?color=cyan
[npm-link]: https://www.npmjs.com/package/jest-package-audit

[license-badge]: https://flat.badgen.net/npm/license/jest-package-audit

[auto-badge]: https://img.shields.io/badge/release-auto.svg?style=flat-square&color=9B065A&label=auto&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAACzElEQVR4AYXBW2iVBQAA4O+/nLlLO9NM7JSXasko2ASZMaKyhRKEDH2ohxHVWy6EiIiiLOgiZG9CtdgG0VNQoJEXRogVgZYylI1skiKVITPTTtnv3M7+v8UvnG3M+r7APLIRxStn69qzqeBBrMYyBDiL4SD0VeFmRwtrkrI5IjP0F7rjzrSjvbTqwubiLZffySrhRrSghBJa8EBYY0NyLJt8bDBOtzbEY72TldQ1kRm6otana8JK3/kzN/3V/NBPU6HsNnNlZAz/ukOalb0RBJKeQnykd7LiX5Fp/YXuQlfUuhXbg8Di5GL9jbXFq/tLa86PpxPhAPrwCYaiorS8L/uuPJh1hZFbcR8mewrx0d7JShr3F7pNW4vX0GRakKWVk7taDq7uPvFWw8YkMcPVb+vfvfRZ1i7zqFwjtmFouL72y6C/0L0Ie3GvaQXRyYVB3YZNE32/+A/D9bVLcRB3yw3hkRCdaDUtFl6Ykr20aaLvKoqIXUdbMj6GFzAmdxfWx9iIRrkDr1f27cFONGMUo/gRI/jNbIMYxJOoR1cY0OGaVPb5z9mlKbyJP/EsdmIXvsFmM7Ql42nEblX3xI1BbYbTkXCqRnxUbgzPo4T7sQBNeBG7zbAiDI8nWfZDhQWYCG4PFr+HMBQ6l5VPJybeRyJXwsdYJ/cRnlJV0yB4ZlUYtFQIkMZnst8fRrPcKezHCblz2IInMIkPzbbyb9mW42nWInc2xmE0y61AJ06oGsXL5rcOK1UdCbEXiVwNXsEy/6+EbaiVG8eeEAfxvaoSBnCH61uOD7BS1Ul8ESHBKWxCrdyd6EYNKihgEVrwOAbQruoytuBYIFfAc3gVN6iawhjKyNCEpYhVJXgbOzARyaU4hCtYizq5EI1YgiUoIlT1B7ZjByqmRWYbwtdYjoWoN7+LOIQefIqKawLzK6ID69GGpQgwhhEcwGGUzfEPAiPqsCXadFsAAAAASUVORK5CYII=
[auto-link]: https://github.com/intuit/auto

[jest-badge]: https://flat.badgen.net/badge/tested%20with/jest/99424f
[jest-link]: https://github.com/facebook/jest

[async-matchers]: https://jestjs.io/blog/2018/05/29/jest-23-blazing-fast-delightful-testing.html#custom-asynchronous-matchers
[jest-retry-times]: https://github.com/facebook/jest/blob/f45d1c939cbf55a71dbfdfc316d2be62b590197f/docs/JestObjectAPI.md#jestretrytimes
