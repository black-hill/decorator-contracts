# Decorator Contracts

[![Build Status](https://dev.azure.com/thenewobjective/decorator-contracts/_apis/build/status/Build?branchName=master)](https://dev.azure.com/thenewobjective/decorator-contracts/_build/latest?definitionId=11&branchName=master)

## Table of Contents

- [Introduction](#introduction)
- [Library Installation](#library-installation)
- [Usage](#usage)
- [Assertions](#assertions)
- [Invariants](#invariants)
- [Demands](#demands)
- [Ensures](#ensures)
- [Overrides](#overrides)
- [Rescue](#rescue)
- [The order of assertions](#the-order-of-assertions)
- [Contributing](#contributing)
- [Building and Editing](#building-and-editing)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Build and Test](#build-and-test)
- [Dependencies](#dependencies)
- [Further Reading](#further-reading)

## Introduction

Decorator Contracts is a library that provides the ability to create and assign
Code Contracts to ECMAScript and TypeScript classes. This enables
enforcement of the
[Liskov substitution principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle)
and the
[Open-closed principle](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle)
of [SOLID](https://en.wikipedia.org/wiki/SOLID) to support
[Design By Contract™](https://en.wikipedia.org/wiki/Design_by_contract).

## Library Installation

This library is not published to the [npm registry](https://www.npmjs.com/).
To install this library add the following to your `.npmrc` file:

```text
@thenewobjective:registry=https://pkgs.dev.azure.com/thenewobjective/decorator-contracts/_packaging/public/npm/registry/
always-auth=true
```

Then run the command:

`npm install @thenewobjective/decorator-contracts`

## Usage

After installation the library can be imported as such:

```typescript
import {Contracts} from '@thenewobjective/decorator-contracts';
```

It is not enough to import the library though, there are two modes of usage:
`checked` and `unchecked`. This is represented as a boolean argument to the
`Contracts` constructor.

checked mode: `true`

unchecked mode: `false`

```typescript
let {assert, invariant, override, rescue, demands, ensures} = new Contracts(true);
```

During development and testing you will want to use checked mode. This will
enable all assertion checks. In production mode all assertion checks become
no-ops for run-time efficiency. As the number of contract definitions can
be numerous, using the appropriate mode becomes increasingly important.

You are not prevented from mixing modes in the event you desire you maintain
a number of checks in a production environment.

## Assertions

Assertions are a fundamental tool for enforcing correctness in an implementation.
They are used inline to express a condition that must evaluate to true at a
particular point of execution.

```typescript
let assert: Contracts['assert'] = new Contracts(true).assert;

function avg(xs: number[]): number {
    assert(xs.length > 0, 'The list can not be empty')

    return xs.reduce((sum, next) => sum + next) / xs.length
}
```

In TypeScript `assert` will also assert the type of the condition:

```typescript
let str: any = 'foo';

str.toUpperCase(); // str is any

assert(typeof str == 'string');

str.toUpperCase(); // str is now a string
```

Due to a [limitation](https://github.com/microsoft/TypeScript/issues/36931) in the current version of TypeScript (3.9),
an explicit type must be assigned to the `assert` as shown above.

In checked mode the assertion is evaluated and throws an exception when its condition is false.
In unchecked mode, assertions always return.

## Invariants

The `@invariant` decorator describes and enforces the semantics of a class
via a provided assertion. This assertion is checked after the associated class
is constructed, before and after every method execution, and before and after
every accessor usage (get/set). If any of these evaluate to false during class
usage, an `AssertionError` will be thrown. Truthy assertions do not throw an
error. An example of this is given below using a Stack:

```typescript
function sizeClamped(this: Stack<any>) {
    return this.size >= 0 && this.size <= this.limit;
}

function emptyHasNoSize(this: Stack<any>) {
    return this.isEmpty() == (this.size == 0);
}

function fullIsLimited(this: Stack<any>) {
    return this.isFull() == (this.size == this.limit);
}

@invariant(sizeClamped)
@invariant(emptyHasNoSize)
@invariant(fullIsLimited)
class Stack<T> {
    #implementation: T[] = [];

    constructor(readonly limit: number) {}

    clear(): void {
        this.#implementation = [];
    }

    isEmpty(): boolean {
        return this.#implementation.length == 0;
    }

    isFull(): boolean {
        return this.#implementation.length == this.limit;
    }

    pop(): T {
        return this.#implementation.pop()!;
    }

    push(item: T): void {
        this.#implementation.push(item);
    }

    get size(): number {
        return this.#implementation.length;
    }

    top(): T {
        return this.#implementation[this.#implementation.length - 1];
    }
}
```

With the above invariants any attempt to construct an invalid stack will fail:

```typescript
let myStack = new Stack(-1)
```

Additionally, attempting to pop an item from an empty stack would be
nonsensical according to the invariants therefore the following will
throw an `AssertionError` and prevent `pop()` from being executed:

```typescript
let myStack = new Stack(3)
let item = myStack.pop();
```

Whether you have invariants for a class or not it is necessary to use the
decorator anyway on one of the base classes.

```typescript
@invariant
class BaseClass {}

class Subclass extends BaseClass {}
```

This is because the decorators work in relationship to others
in the class hierarchy and the `@invariant` manages this interclass
relationship.

Whether you have invariants for a class or not it is necessary to declare one
anyway on one of the base classes.

## Demands

The `@demands` decorator describes and enforces an assertion that must be true
before its associated feature can execute. In other words before a client
of your class can execute a method or accessor the defined precondition
must first be met or an error will be raised [to the client](#the-order-of-assertions).

```typescript

function notEmpty(this: Stack<T>){ return !this.isEmpty(); }

@invariant
class Stack<T> {
    ...
    @demands(notEmpty)
    pop(): T {
        return this.#implementation.pop();
    }
}
```

In the above example the precondition of executing `pop`
on a stack is that it is not empty. If this assertion fails
an AssertionError is raised.

An `@invariant` decorator must also be defined either on the current class
or on an ancestor as shown in the example.

Static features, including the constructor, can not be assigned a `@demands`
decorator. In the future this may be enabled for non-constructor static methods
but the implications are not clear at present.

If a class feature is overridden then the `@demands` assertion still applies:

```typescript
class MyStack<T> extends Stack<T> {
    @overrides
    pop(): { ... }
}

...
let myStack = new MyStack()

myStack.pop() // throws
```

If a class feature with an associated `@demands` is overridden, then the new
feature can have a `@demands` declaration of its own. This precondition can
not strengthen the precondition of the original feature. The new precondition
will be or-ed with it's ancestors. If any are true, then the obligation is
considered fulfilled by the user of the feature.

```typescript
@invariant
class Base {
    @demands((x: number) => 0 <= x && x <= 10)
    method(x: number) { ... }
}

class Sub extends Base {
    @override
    @demands((x: number) => -10 <= x && x <= 20)
    method(x: number) { ... }
}
```

In the above example the precondition of `Sub.prototype.method` is:

`(-10 <= x && x <= 20) || (0 <= x && x <= 10)`

Multiple `@demands` can be declared for a feature. Doing so will require that
all of these are true before the associated feature will execute:

```typescript
@invariant
class Base {
    @demands((x: number) => 0 <= x && x <= 10)
    @demands((x: number) => x % 2 == 0)
    method(x: number) { ... }
}

class Sub extends Base {
    @override
    @demands((x: number) => -10 <= x && x <= 20)
    @demands((x: number) => Number.isInteger(x))
    method(x: number) { ... }
}
```

In the above example the precondition of `Base.prototype.method` is:

`(0 <= x && x <= 10) && (x % 2 == 0)`.

The precondition of `Sub.prototype.method` is:

`(-10 <= x && x <= 20) && Number.isInteger(x) || (0 <= x && x <= 10) && (x % 2 == 0)`

## Ensures

The @ensures decorator describes and enforces an assertion that must be true after its associated feature has executed. In other words after a client of your class has executed a method or accessor the defined postcondition must be met or an error [will be raised](#the-order-of-assertions).

```typescript
function notEmpty(this: Stack<T>){ return !this.isEmpty(); }

@invariant
class Stack<T> {
    ...
    @ensures(notEmpty)
    push(value: T) {
         this.#implementation.push(value);
    }
}
```

In the above example the postcondition of executing push on a stack is that it is not empty. If this assertion fails an AssertionError is raised.

An @invariant decorator must also be defined either on the current class or on an ancestor as shown in the example.

Static features, including the constructor, can not be assigned an @ensures decorator. In the future this may be enabled for non-constructor static methods but the implications are not clear at present.

If a class feature is overridden then the @ensures assertion still applies:

```typescript
class MyStack<T> extends Stack<T> {
    @overrides
    push(value: T): { ... }
}

...
let myStack = new MyStack()

myStack.push()
myStack.isEmpty() == false;
```

If a class feature with an associated @ensures is overridden, then the new feature can have an @ensures declaration of its own. This postcondition can not weaken the postcondition of the original feature. The new postcondition will be and-ed with it's ancestors. If all are true, then the obligation is considered fulfilled by the user of the feature, otherwise an AssertionError is raised.

```typescript
@invariant
class Base {
    @ensures((x: number) => 0 <= x && x <= 10)
    method(x: number) { ... }
}

class Sub extends Base {
    @override
    @ensures((x: number) => -10 <= x && x <= 20)
    method(x: number) { ... }
}
```

In the above example the postcondition of Sub.prototype.method is:

`(-10 <= x && x <= 20) && (0 <= x && x <= 10)`

Multiple @ensures can be declared for a feature. Doing so will require that all of these are true after the associated feature has executed:

```typescript
@invariant
class Base {
    @ensures((x: number) => 0 <= x && x <= 10)
    @ensures((x: number) => x % 2 == 0)
    method(x: number) {
        ... }
}

class Sub extends Base {
    @override
    @ensures((x: number) => -10 <= x && x <= 20)
    @ensures((x: number) => Number.isInteger(x))
    method(x: number) { ... }
}
```

In the above example the postcondition of Base.prototype.method is:

`(0 <= x && x <= 10) && (x % 2 == 0)`

The postcondition of Sub.prototype.method is:

`(-10 <= x && x <= 20) && Number.isInteger(x) && (0 <= x && x <= 10) && (x % 2 == 0)`

## Overrides

Class features implemented in a superclass can be overridden in a subclass. The
subclass implementation can augment or entirely replace the one belonging
to the superclass. This can be done for a variety of reasons, such as
providing a more efficient implementation in the context of the subclass.
Regardless of the reason, the overridden member should be semantically
consistent with the superclass member. In other
words, it should follow [Liskov's Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle).
To aid in the enforcement and documentation of this principle the library
provides an `@override` decorator for class methods and accessors.

A simple example is calculating the area of Convex Polygons. While a general
formula exists to accomplish this, more efficient and direct formulas exist
for specific polygons such as a Right Triangle:

```typescript
type Side = number
type Vertex = [number, number]

let _triArea = (v1: Vertex, v2: Vertex, v3: Vertex): number => {
    let a = Math.hypot((v1[0] - v2[0]), (v1[1] - v2[1])),
        b = Math.hypot((v2[0] - v3[0]), (v2[1] - v3[1])),
        c = Math.hypot((v3[0] - v1[0]), (v3[1] - v1[1])),
        s = 0.5 * (a + b + c)

    return Math.sqrt(s*(s-a)*(s-b)*(s-c))
}

@invariant
class ConvexShape {
    readonly vertices: Vertex[]

    constructor(...vertices: Vertex[]) {
        this.vertices = vertices
    }

    area(): number {
        let [v1, v2, v3, ...vs] = this.vertices
        return this.vertices.length >= 3 ?
            _triArea(v1, v2, v3) + new ConvexShape(v1, v3, ...vs).area() :
            0
    }
}

class RightTriangle extends ConvexShape {
    constructor(
        readonly base: Side,
        readonly height: Side
    ) {
        super([0,0], [base,0], [base,height])
    }

    @override
    area(): number {
        return this.base * this.height / 2
    }
}
```

Above you can see the `area()` method being overridden with the more
efficient implementation. The `@override` decorator makes explicit
that the method is replacing another implementation.

This decorator does not only document and verify that the method is
overridden; it will also verify that the parameter count matches.

An `@invariant` decorator must also be defined either on the current class
or on an ancestor. When defined, candidate overrides are identified and an
error is raised if an associated `@override` is missing on that feature.

Static methods, including the constructor, can not be assigned an `@override`
decorator. In the future this may be enabled for non-constructor static methods
but the implications are not clear at present.

## Rescue

The `@rescue` decorator enables a mechanism for providing Robustness.
Robustness is the ability of an implementation to respond to situations
not specified; in other words the ability to handle exceptions (pun intended).
This decorator can be assigned to both classes and its non-static features.
The intent of this is to restore any invariants of the class and optionally retry
execution.

```typescript
function popRescue(
    error: any,
    args: Parameters<typeof Stack.prototype.pop>,
    retry: (...retryArgs: typeof args) => void
) {
    console.log(error)
}

@invariant
class Stack<T> {
    ...
    @rescue(popRescue)
    pop(): T {
        assert(!this.isEmpty(), 'You can not pop from an empty stack')

        return this.#implementation.pop()!
    }
    ...
}
```

In the above naive example if the `pop` method is called when the stack is
empty an exception occurs. The `@rescue` decorator then intercepts this
exception and handles it by simply logging the error. The exception is
then raised to the caller.

You also have the ability to retry the execution of the decorated
feature again from the beginning by calling the `retry` function.
This provides a mechanism for
[fault tolerance](https://en.wikipedia.org/wiki/Fault_tolerance).
When retry is called the exception will no longer be raised to the caller.
`retry` can only be called once per exception rescue.

Only a single `@rescue` can be assigned to a feature. Adding more than one
will raise an error.

An `@invariant` decorator must also be defined either on the current class
or on an ancestor.

## The order of assertions

```ts
        (error) <-----------------+
                    ^ (throws)    | (throws)
                    |             |
obj.feature(...) -> @invariant -> @demands -> { feature body } --+
                    ^                         |                  |
                    |                         | (throws)         |
                    | (retry)                 |                  | (return)
                    +------------ @rescue <---+------+           |
                                  |                  |           |
                                  | (throws|return)  |           |
        (error) <--- @invariant <-+                  |           |
                                                     | (throws)  |
                                                     |           |
       (return) <-- @invariant <---------------- @ensures <------+
```

When `obj.feature` is called the happy path is:

```ts
@invariant -> @demands -> { feature body } -> @ensures -> @invariant
```

If an error is thrown and there is no `@rescue` defined then the `@invariant`
is checked before the error is raised to the caller.

If an error is thrown in the `@invariant` then it is raised to the caller.

If an error is thrown in the `@demands` then the error is raised to the caller.
In this case the `@invariant` is not checked because the feature body has not
been entered and the decorator can not modify the state of the class without
calling another method which is governed by its own contracts.

If an error is thrown by the feature body or the `@ensures` then
the `@rescue` is executed. If `retry` is called then the process
starts from the beginning.

If `@rescue` throws an error or does not call `retry` then the
`@invariant` is checked before the error is raised to the caller.

## Contributing

Due to current licensing restrictions, contributions are not being accepted currently.

## Building and Editing

## Getting Started

- Clone the repository

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

## Project Structure

| Name              | Description                                                                                                   |
|:------------------|:--------------------------------------------------------------------------------------------------------------|
| .cache            | Cache directory generated by [Parcel](https://parceljs.org/)                                                  |
| .vscode           | Settings for VS Code                                                                                          |
| azure             | Build pipeline definitions used by Azure Devops                                                               |
| dist              | Contains the compiled output of the build                                                                     |
| docs              | Library documentation                                                                                         |
| node_modules      | node package dependencies                                                                                     |
| src               | Contains the source code that will be compiled to the `dist` dir                                              |
| .editorconfig     | Config settings for [EditorConfig](https://editorconfig.org/) IDE code style checking                         |
| .gitignore        | Specifies files untracked by version control                                                                  |
| .npmrc            | npm config settings                                                                                           |
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
| `build-nofix` | Perfoms the sames steps as `build` except that `lint-nofix` will be executed.                            |
| `build-types` | Generates type definitions for the library in the `dist` folder                                          |
| `clean`       | deletes the `dist` folder                                                                                |
| `clean-full`  | deletes the `dist`, `node_modules`,  and `.cache` folders                                                |
| `debug`       | Starts debugger                                                                                          |
| `lint`        | Performs linting and type checking of the library                                                        |
| `lint-nofix`  | Performs linting but will not autofix problems.                                                          |
| `test`        | Executes unit tests                                                                                      |
| `type-check`  | Performs type checking                                                                                   |

## Dependencies

Dependencies are managed through `package.json`. There are no runtime dependencies.
The development dependencies are as follows:

| Package                                   | Description                                 | License      |
|:------------------------------------------|:--------------------------------------------|--------------|
| `@types/jest`                             | Type definitions for `ts-jest` support      | MIT          |
| `@types/node`                             | Type definitions for node. (used for build) | MIT          |
| `@typescript-eslint/eslint-plugin`        | Type definitions for ESLint                 | MIT          |
| `@typescript-eslint/eslint-plugin-tslint` | Type definitions for ESLint extension       | MIT          |
| `@typescript-eslint/parser`               | Type definitions for ESLint parser          | BSD-2-Clause |
| `commander`                               | Command line library                        | MIT          |
| `eslint`                                  | ECMAScript linting library                  | MIT          |
| `eslint-plugin-header`                    | ESLint extension for linting file headers   | MIT          |
| `eslint-plugin-import`                    | ESLint extension for linting imports        | MIT          |
| `jest`                                    | JavaScript Unit testing library             | MIT          |
| `jest-junit`                              | Jest extension for JUnit reporting          | Apache-2.0   |
| `ts-jest`                                 | TypeScript support for `jest`               | MIT          |
| `ts-loader`                               | TypeScript loader for Webpack               | MIT          |
| `typescript`                              | TypeScript compiler                         | Apache-2.0   |
| `webpack`                                 | Module bundler                              | MIT          |
| `webpack-cli`                             | Command line library for WebPack            | MIT          |

If you're using Windows and a newer version of NodeJS then you may additionally
need to run the following command due to a transitive dependency on [node-gyp](https://github.com/nodejs/node-gyp):

`npm install -g windows-build-tools`

## Further Reading

- [Design by Contract](https://en.wikipedia.org/wiki/Design_by_contract)
- [Liskov Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle)
- [Object-Oriented Software Construction](https://en.wikipedia.org/wiki/Object-Oriented_Software_Construction)
