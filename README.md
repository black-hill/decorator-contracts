# Decorator Contracts

[![Build Status](https://dev.azure.com/thenewobjective/decorator-contracts/_apis/build/status/Build?branchName=master)](https://dev.azure.com/thenewobjective/decorator-contracts/_build/latest?definitionId=11&branchName=master)

## Table of Contents

- [Introduction](#introduction)
- [Library Installation](#library-installation)
- [Usage](#usage)
- [Assertions](#assertions)
- [Invariants](#invariants)
- [Licensing](#licensing)

## Introduction

TODO

[Code Contracts](https://en.wikipedia.org/wiki/Design_by_contract)

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
import Contracts from '@thenewobjective/decorator-contracts';
```

It is not enough to import the library though, there are two modes of usage:
`debug` and `production`. This is represented as a boolean argument to the
`Contracts` constructor.

debug mode: `true`

production mode: `false`

```typescript
let {assert, invariant} = new Contracts(true);
```

During development and testing you will want to use debug mode. This will
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
let {assert} = new Contracts(true);

function avg(xs: number[]): number {
    assert(xs.length > 0, 'The list can not be empty')

    return xs.reduce((sum, next) => sum + next) / xs.length
}
```

Assertions can also be used with conditionals as they return a boolean value.
So if you find yourself writing code like the following:

```typescript
let {assert} = new Contracts(true);

...

assert(p,'message')
if(p) {
    ...
} else {
    ...
}
```

or:

```typescript
let s: boolean = ...;
assert(q(s), 'message')
do {
    ...
    s = ...;
    assert(q(s), 'message')
} while(q(s))
```

Then you can simplify this as:

```typescript
if(assert(p,'message')) {
    ...
} else {
    ...
}

let s: boolean = ...;
while(assert(q(s), 'message')) {
    ...
    s = ...;
}
```

In debug mode the assertions is evaluated and throws an exception of failure,
otherwise returns true. In production mode, assertions always return true.

## Invariants

The `@invariant` decorator describes and enforces the semantics of a class
via a provided assertion. This assertion is checked after the associated class
is constructed, before and after every method execution, and before and after
every property usage (get/set). If any of these evaluate to false during class
usage, an `AssertionError` will be thrown. Truthy assertions do not throw an
error. An example of this is given below using a Stack:

```typescript
@invariant((self: Stack<any>) => self.size >= 0 && self.size <= self.limit)
@invariant((self: Stack<any>) => self.isEmpty() == (self.size == 0))
@invariant((self: Stack<any>) => self.isFull() == (self.size == self.limit))
class Stack<T> {
    protected _implementation: Array<T> = []

    constructor(readonly limit: number) {}

    isEmpty(): boolean {
        return this._implementation.length == 0
    }

    isFull(): boolean {
        return this._implementation.length == this.limit
    }

    pop(): T {
        return this._implementation.pop()!
    }

    push(item: T): void {
        this._implementation.push(item)
    }

    get size(): number {
        return this._implementation.length
    }

    top(): T {
        return this._implementation[this._implementation.length - 1];
    }
}
```

Custom messaging can be associated with each `@invariant` as well:

```typescript
@invariant((self: Stack<any>) => self.size >= 0 && self.size <= self.limit, "The size of a stack must be between 0 and its limit")
@invariant((self: Stack<any>) => self.isEmpty() == (self.size == 0), "An empty stack must have a size of 0")
@invariant((self: Stack<any>) => self.isFull() == (self.size == self.limit), "A full stack must have a size that equals its limit")
class Stack<T> {
    //...
}
```

Declaring multiple invariants in this style is terribly verbose. A shorthand is also available.

Without messaging:

```typescript
@invariant<Stack<any>>(
    self => self.size >= 0 && self.size <= self.limit,
    self => self.isEmpty() == (self.size == 0),
    self => self.isFull() == (self.size == self.limit)
)
class Stack<T> {
    //...
}
```

With messaging:

```typescript
@invariant<Stack<any>>([
    [self => self.size >= 0 && self.size <= self.limit, "The size of a stack must be between 0 and its limit"],
    [self => self.isEmpty() == (self.size == 0), "An empty stack must have a size of 0"],
    [self => self.isFull() == (self.size == self.limit), "A full stack must have a size that equals its limit"]
])
class Stack<T> {
    //...
}
```

With the above invariants any attempt to construct an invalid stack will fail:

```typescript
let myStack = new Stack(-1)
```

Additionally, attempting to pop an item from an empty stack would be
nonsensical according to the invariants. Therefore the following will
throw an AssertionError and prevent pop() from being executed:

```typescript
let myStack = new Stack(3)
let item = myStack.pop();
```

Whether you have invariants for a class or not it is necessary to declare one
anyway on one of the base classes.

```typescript
@invariant()
class BaseClass {}

class Subclass extends BaseClass {}
```

This is because the decorators work in relationship to others
in the class hierarchy and the `@invariant` manages this interclass
relationship.

## Licensing

