/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

/* eslint "require-jsdoc": "off" */

import { Contracts, contracted } from '.';
import { MSG_NO_STATIC, MSG_EXTEND_CONTRACTED } from './Messages';
import AssertionError from './AssertionError';

/**
 * Requirement 242
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/277
 */
describe('The @ensures decorator must be a non-static method decorator only', () => {
    test('Test declaration', () => {
        const {ensures} = new Contracts(true);

        expect(() => {
            class Foo extends contracted() {
                @ensures(() => true)
                method1(): void {}

                @ensures(() => false)
                method2(): void {}
            }

            return Foo;
        }).not.toThrow();

        expect(() => {
            //@ts-ignore: ignoring typescript error for JavaScript testing
            @ensures(() => true)
            class Foo extends contracted() {}

            return Foo;
        }).toThrow(MSG_NO_STATIC);
    });

    test('Invalid declaration', () => {
        expect(() => {
            const {ensures} = new Contracts(true);
            // @ts-ignore: ignore type error for testing
            @ensures(() => true)
            class Foo extends contracted() {}

            return Foo;
        }).toThrow();

        expect(() => {
            const {ensures} = new Contracts(false);
            // @ts-ignore: ignore type error for testing JS usage
            @ensures(() => true)
            class Foo extends contracted() {}

            return Foo;
        }).toThrow();
    });
});

/**
 * Requirement 278
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/278
 */
describe('There can be multiple @ensures decorators assigned to a class feature', () => {
    const {ensures} = new Contracts(true);

    function nonNegative(this: Foo): boolean {
        return this.value >= 0;
    }

    function isEven(this: Foo): boolean {
        return this.value % 2 == 0;
    }

    class Foo extends contracted() {
        #value = 0;

        get value(): number { return this.#value; }
        set value(value: number){ this.#value = value; }

        @ensures(nonNegative)
        @ensures(isEven)
        inc(): void { this.value += 2; }

        @ensures(nonNegative)
        @ensures(isEven)
        dec(): void { this.value -= 1; }
    }

    const foo = new Foo();

    expect(() => foo.inc()).not.toThrow();

    expect(foo.value).toBe(2);

    expect(() => {
        foo.dec();
    }).toThrow(AssertionError); // TODO: more specific error
});

/**
 * Requirement 280
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/280
 */
describe('Features that override a @ensures decorated method must be subject to that decorator', () => {
    const {override, ensures} = new Contracts(true);

    function nonNegative(this: Base): boolean {
        return this.value >= 0;
    }

    class Base extends contracted() {
        #value = 0;

        get value(): number { return this.#value; }
        set value(value: number){ this.#value = value; }

        inc(): void { this.value++; }

        @ensures(nonNegative)
        dec(): void { this.value--; }
    }

    class Sub extends Base {
        @override
        dec(): void {
            this.value -= 2;
        }
    }

    // TODO: test multiple overrides

    test('inc(); inc(); dec(); does not throw', () => {
        expect(() => {
            const sub = new Sub();
            sub.inc();
            sub.inc();
            sub.dec();
        }).not.toThrow();
    });

    test('dec(); throws', () => {
        expect(() => {
            const sub = new Sub();
            sub.dec();
        }).toThrow();
    });
});

/**
 * Requirement 284
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/284
 */
describe('@ensures is evaluated after its associated member is called', () => {
    const {ensures} = new Contracts(true);

    function nonNegative(this: Foo): boolean {
        return this.value >= 0;
    }

    class Foo extends contracted() {
        #value = 0;

        get value(): number { return this.#value; }
        set value(value: number) { this.#value = value; }
    }

    test('true @ensures check does not throw', () => {
        class Bar extends Foo {
            @ensures(nonNegative)
            method(): number {
                return this.value = 2;
            }
        }

        const bar = new Bar();

        expect(bar.method()).toBe(2);
    });

    test('false @ensures check throws', () => {
        class Bar extends Foo {
            @ensures(() => false)
            method(): number {
                return this.value = 12;
            }
        }
        const bar = new Bar();

        expect(() => { bar.method(); }).toThrow();
    });
});

/**
 * Requirement 286
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/286
 */
describe('@ensures has a checked mode and unchecked mode', () => {
    test('The associated assertion is evaluated when checkMode = true', () => {
        const {ensures} = new Contracts(true);

        class Foo extends contracted() {
            @ensures(() => false)
            method(): void {}
        }

        expect(() => new Foo().method()).toThrow();
    });

    test('The associated assertion is NOT evaluated in checkMode = false', () => {
        const {ensures} = new Contracts(false);

        class Foo extends contracted() {
            @ensures(() => false)
            method(): void {}
        }

        expect(() => new Foo().method()).not.toThrow();
    });
});

/**
 * Requirement 397
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/397
 */
describe('Postconditions cannot be weakened in a subtype', () => {
    const {ensures, override} = new Contracts(true);

    class Base extends contracted() {
        @ensures((value: number) => 10 <= value && value <= 30)
        method(value: number): number { return value; }
    }

    test('Base postcondition', () => {
        const base = new Base();

        expect(base.method(15)).toBe(15);
        expect(base.method(25)).toBe(25);
        expect(() => base.method(5)).toThrow('Postcondition failed on Base.prototype.method');
        expect(() => base.method(35)).toThrow('Postcondition failed on Base.prototype.method');
    });

    class Weaker extends Base {
        @override
        @ensures((value: number) => 1 <= value && value <= 50)
        method(value: number): number { return value; }
    }

    test('Weaker postcondition', () => {
        const weaker = new Weaker();

        expect(weaker.method(15)).toBe(15);
        expect(weaker.method(25)).toBe(25);
        expect(() => weaker.method(5)).toThrow('Postcondition failed on Weaker.prototype.method');
        expect(() => weaker.method(35)).toThrow('Postcondition failed on Weaker.prototype.method');
    });

    class Stronger extends Base {
        @override
        @ensures((value: number) => 15 <= value && value <= 20)
        method(value: number): number { return value; }
    }

    test('Stronger precondition', () => {
        const stronger = new Stronger();

        expect(stronger.method(15)).toBe(15);
        expect(stronger.method(20)).toBe(20);
        expect(() => stronger.method(25)).toThrow('Postcondition failed on Stronger.prototype.method');
        expect(() => stronger.method(5)).toThrow('Postcondition failed on Stronger.prototype.method');
        expect(() => stronger.method(35)).toThrow('Postcondition failed on Stronger.prototype.method');
    });
});

/**
 * Requirement 539
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/539
 */
describe('A class feature with a decorator must not be functional until the @invariant is defined', () => {
    const {ensures} = new Contracts(true);

    class Okay extends contracted() {
        @ensures((value: number) => 10 <= value && value <= 30)
        method(value: number): number { return value; }
    }

    test('Valid declaration', () => {
        const okay = new Okay();

        expect(okay.method(15)).toBe(15);
    });

    class Fail extends contracted() {
        @ensures((value: number) => 10 <= value && value <= 30)
        method(value: number): number { return value; }
    }

    test('Invalid declaration', () => {
        const fail = new Fail();

        expect(() => fail.method(15)).toThrow(MSG_EXTEND_CONTRACTED);
    });
});