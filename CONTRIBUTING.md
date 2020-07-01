# Contributing
We greatly appreciate contributions, please follow this guide so we can get your changes merged as quickly as possible. However, please bare in mind this package was built for internal usage at Xerox, so breaking changes will have to be considered carefully.

If you have found a bug or want to add a feature please first raise an issue, so it can be discussed before time is spent implementing it.

## Setting up the development environment
Firstly you will need to fork this repository and clone it locally, you will want to branch from the "next" branch.

You will need to have the following installed:
- [Node.js 12.x](https://nodejs.org/en/)
- [Yarn > 1.12](https://classic.yarnpkg.com/en/docs/install)

When you have completed the above, run `yarn install` in the root of your cloned fork.

## Linting
Running `yarn lint` will run a set of linting rules against the TypeScript files in the codebase, it is a good idea to also run `yarn type-check` to make sure all the TypeScript is valid. For a more integrated workflow we recommend using VSCode, in doing so you will be recommended extensions to use with this codebase which will show linting errors inline in the code.

The linting rules are there to enforce best-practises and code-style (via prettier), this is a requirement for contributing as it makes the reviewers job easier by reducing the checking criteria.

## Testing
This project uses [Jest](https://jestjs.io/) to run unit tests written in TypeScript, these ensure changes do not break existing behaviour. Where applicable you should add new tests to cover the changes you are adding.

## Commit style
When commiting code the message you use should follow the [Angular commit style](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines), this is enforced with git commit hooks, meaning commits in the wrong format will not go through and will produce an error. This style enforces consistency and also allows us to auto-generate changelogs and version numbers, for example `feat: message` will bump the minor version whereas `fix: message` will bump the patch version.

## Continous Integration
Linting, testing and publishing is all run inside of GitHub Actions when PRs are created into the next branch, this means you can make sure your changes will be compatible. PRs need to pass these checks before they will be reviewed by a maintainer.

## Creating a pull request
When you have made your changes and are ready for them to be merged, create a pull request from your fork branch to the next branch of jest-package-audit. The title of the PR should reflect the changes made, if you have made a lot of commits in the PR that you don't think are relevant to a changelog, set the PR title as a single commit message in the Angular format and that can be used instead. In the PR body please reference the related issue prefixed by either `closes:` or `fixes:`.

While preparing the pull-request please create a draft pull-request so you can make sure all the tests pass and everyhing is formatted correctly before clicking "Ready for Review".
