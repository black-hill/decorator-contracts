# Contributing

This file outlines the project structure as well as rules for contribution.

## Table of Contents

- [Reporting Bugs and Suggesting Features](#reporting-bugs-and-suggesting-features)
- [Code Contributions](#code-contributions)
- [Getting Started](#getting-started)
- [Project Management](#project-management)
- [Branching Model](#branching)
- [Project Structure](#project-structure)
- [Build and Test](#build-and-test)
- [Dependencies](#dependencies)

## Reporting Bugs and Suggesting Features

Contributors can create new items [here](https://dev.azure.com/thenewobjective/decorator-contracts/_workitems).

Non-Contributors will have to send an email to [Michael Haufe](mailto:tno@thenewobjective.com).
In the future this will be unnecessary when Microsoft resolves the following
[issue](https://developercommunity.visualstudio.com/content/idea/366493/allow-anonymous-creation-of-user-stories-and-bugs-1.html).

## Code Contributions

While this code is open source, it is not necessarily free
(See the Licensing section in [README.md](https://dev.azure.com/thenewobjective/_git/decorator-contracts?path=%2FREADME.md&anchor=licensing)).
Due to licensing, contributions to this project can not contain code or other
material that prevents or restricts commercial use in a closed-source
application. To enforce this you will need to agree to the Contributor
License Agreement (for [individuals](https://dev.azure.com/thenewobjective/_git/decorator-contracts?path=%2FCLA-individual.md) or
[entities](https://dev.azure.com/thenewobjective/_git/decorator-contracts?path=%2FCLA-entities.md) as appropriate).
To do this send an email to `cla@thenewobjective.com` based on one of the following templates
depending on the CLA you are agreeing to:

### Individual Contributor License Agreement

```text
2019-10-09

I hereby agree to the terms of the "Decorator Contracts Individual Contributor License Agreement", with MD5 checksum 7B927CCF6787F84668C56345072DB6E5.

I furthermore declare that I am authorized and able to make this agreement and sign this declaration.

Signed,

Michael L. Haufe https://thenewobjective.com
```

You can verify the MD5 hash by executing the following powershell command:

```powershell
Get-FileHash ./CLA-individual.md -Algorithm MD5
```

### Decorator Contracts Entity Contributor License Agreement

```text
2019-10-09

I hereby agree to the terms of the "Decorator Contracts Entity Contributor License Agreement", with MD5 checksum 9938BFB4D7AD2DEDF5FF089D5380DD48.

I furthermore declare that I am authorized and able to make this agreement and sign this declaration.

Signed,

Michael L. Haufe https://thenewobjective.com
```

You can verify the MD5 hash by executing the following powershell command:

```powershell
Get-FileHash ./CLA-entities.md -Algorithm MD5
```

Shortly after submission of your agreement, if considered valid,
you (the email address used to submit) will be granted contributor
access to the project.

## Getting Started

- Clone the repository. To save time, you can clone without full history with
the `--depth=1` flag:

```batch
git clone --depth=1 ...
```

- Install dependencies

```batch
cd <project_name>
npm install
```

- Build

```batch
npm run build
```

## Project Management

The project follows a requirements driven, iterative approach.

### Features

A feature is a distinctly identifiable element of the system that satisfies a
set of requirements {TODO}

### Iterations

Iterations are named by the planned release version such as `v0.4.0`
or `1.0.0` depending on the amount of progress made. The iterations
are currently one week in length (long enough to implement at least
one feature). The first day of the iteration consists of planning taskss
and refinement if necessary. On the last day of the iteration all completed
features are merged into the master branch. Unfinished features are moved
to the next iteration. If no features were completed by the end of
the iteration, then the length of the iteration is extended until at least
one feature can be completed (otherwise it was not an iteration by definition).

## Branching Model

```text
                                                      v0.1.0
master               +-----+-----------------------------+------>
                           |                             ^
features/feature-x   +--------+--------------+-----------+
                              |              ^
                              |              |
users/{userName}/{branchName} +--------------+

```

Attempts to create branches outside of the above locations are restricted
by policy and ill result in an error being returned.

### Master Branch

The `master` branch contains production ready code. At particular points
in time a tag is associated which identifies the version. Development is
not performed against this branch directly and it only accepts pull-requests
from the `feature` branches and from hotfixes if warranted. Validation is
performed before any merge occurs

### Tags

The general tagging rule is that every new feature increments the version
by 0.1.0 and sets the 3rd digit to 0. Every bug fix or sub-feature update
(rare) increments the version by 0.0.1. Milestones increment the version by 1.0.0
and sets the 2nd and 3rd digits to 0. These tags are planned for at the beginning
of every iteration. See the [Iterations](#iterations) section for more information.

### Feature Branches

Feature branches manage [feature](#features) implementions. Like the `master`
branch, these branches only accept pull requests. They are also located
under a branch folder with the following format:

```text
features/feature-###
```

These branches are created at the beginning of an iteration and deleted at
the end when merged into `master`. Validation is performed before any merge
occurs into this branch.

### User Branches

There is a branch folder called `users/` where all implementation work is performed.
The format is: `users/{userName}/{branchName}`. For example: `users/mlhaufe/bug-130`.
The branch name is arbitrary and chosen by the developer creating the branch, but
should be branched from an existing feature branch.

## Project Structure

| Name              | Description                                                                                                   |
|:------------------|:--------------------------------------------------------------------------------------------------------------|
| .cache            | Cache directory generated by [Parcel](https://parceljs.org/)                                                  |
| .vscode           | Settings for VS Code                                                                                          |
| azure             | Build pipeline definitions used by Azure Devops                                                               |
| coverage          |                                                                                                               |
| dist              | Contains the compiled output of the build                                                                     |
| docs              | Library documentation                                                                                         |
| node_modules      | node package dependencies                                                                                     |
| src               | Contains the source code that will be compiled to the `dist` dir                                              |
| .editorconfig     | Config settings for [EditorConfig](https://editorconfig.org/) IDE code style checking                         |
| .gitignore        | Specifies files untracked by version control                                                                  |
| .npmrc            | npm config settings                                                                                           |
| CLA-entities.md   | Entity Contributor License Agreement                                                                          |
| CLA-individual.md | Individual Contributor License Agreement                                                                      |
| CONTRIBUTING.md   | Contributing guide                                                                                            |
| LICENSE           | GNU General Public License v2.0 only                                                                          |
| package-lock.json | Autogenerated [meta-manifest](https://docs.npmjs.com/files/package-lock.json) of package.json                 |
| package.json      | [Node Package configuration](https://docs.npmjs.com/files/package.json) settings with related build scripts   |
| README.md         | The current file. A high level overview of the library                                                        |
| tsconfig.json     | Config settings for compiling TypeScript code                                                                 |
| tslint.json       | Config settings for TSLint code style checking                                                                |

## Build and Test

To build and test this library locally you will need the following:

- [VS Code](https://code.visualstudio.com/)

  - Install the recommended extensions

- A [active](https://github.com/nodejs/Release) version of [Node.js](https://nodejs.org/en/)
  - With a corresponding [npm installation](https://www.npmjs.com/get-npm)

| Npm Script    | Description |
|:--------------|:------------|
| `build`       | Performs a full build of the library including type generation and linting. Outputs to the `dist` folder |
| `build-types` | Generates type definitions for the library in the `dist` folder                                          |
| `clean`       | deletes the `dist` folder                                                                                |
| `clean-full`  | deletes the `dist`, `node_modules`,  and `.cache` folders                                                |
| `debug`       | Starts debugger                                                                                          |
| `lint`        | Performs linting and type checking of the library                                                        |
| `test`        | Executes unit tests                                                                                      |
| `type-check`  | Performs type checking                                                                                   |

## Dependencies

Dependencies are managed through `package.json`. There are no runtime dependencies.
The development dependencies are as follows:

| Package          | Description                                           |
|:-----------------|:------------------------------------------------------|
| `@types/jest`    | Type Definitions for `ts-jest` support                |
| `jest`           | JavaScript Unit testing library                       |
| `parcel-bundler` | Web Application bundler                               |
| `rimraf`         | OS-Agnostic remove command for deleting files/folders |
| `ts-jest`        | TypeScript support for `jest`                         |
| `tslint`         | TypeScript linting library                            |
| `typescript`     | TypeScript compiler                                   |

## Contributors

[Michael Haufe](https://thenewobjective.com)
