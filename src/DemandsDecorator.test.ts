/*!
 * @license
 * Copyright (C) #{YEAR}# Michael L Haufe
 * SPDX-License-Identifier: AGPL-1.0-only
 */

/* eslint "require-jsdoc": "off" */

import Contracts from '.';
import { MSG_NO_STATIC, MSG_INVARIANT_REQUIRED } from './MemberDecorator';
import AssertionError from './AssertionError';

/**
 * Requirement 241
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/241
 */
describe('The @demands decorator must be a non-static feature decorator only', () => {
    test('Test declaration', () => {
        const {demands} = new Contracts(true);

        expect(() => {
            class Foo {
                @demands(() => true)
                method1(): void {}

                @demands(() => false)
                method2(): void {}
            }

            return Foo;
        }).not.toThrow();

        expect(() => {
            //@ts-ignore: ignoring typescript error for JavaScript testing
            @demands(() => true)
            class Foo {}

            return Foo;
        }).toThrow(MSG_NO_STATIC);
    });

    test('Invalid declaration', () => {
        expect(() => {
            const {demands} = new Contracts(true);
            // @ts-ignore: ignore type error for testing
            @demands(() => true)
            class Foo {}

            return Foo;
        }).toThrow();

        expect(() => {
            const {demands} = new Contracts(false);
            // @ts-ignore: ignore type error for testing
            @demands(() => true)
            class Foo {}

            return Foo;
        }).not.toThrow();
    });
});

/**
 * Requirement 242
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/242
 */
describe('There can be multiple @demands decorators assigned to a class feature', () => {
    const {invariant, demands} = new Contracts(true);

    function nonNegative(this: Foo): boolean {
        return this._value >= 0;
    }

    function isEven(this: Foo): boolean {
        return this._value % 2 == 0;
    }

    @invariant
    class Foo {
        protected _value = 0;

        get value(): number { return this._value; }

        @demands(nonNegative)
        @demands(isEven)
        inc(): void { this._value += 2; }

        @demands(nonNegative)
        @demands(isEven)
        dec(): void { this._value -= 1; }
    }

    const foo = new Foo();

    expect(() => foo.inc()).not.toThrow();

    expect(foo.value).toBe(2);

    expect(() => {
        foo.dec();
        foo.dec();
    }).toThrow(AssertionError); // TODO: more specific error
});

/**
 * Requirement 244
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/244
 */
describe('Features that override a @demands decorated feature must be subject to that decorator', () => {
    const {invariant, override, demands} = new Contracts(true);

    function nonNegative(this: Base): boolean {
        return this._value >= 0;
    }

    @invariant
    class Base {
        protected _value = 0;

        inc(): void { this._value++; }

        @demands(nonNegative)
        dec(): void { this._value--; }
    }

    class Sub extends Base {
        @override
        dec(): void {
            this._value -= 2;
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

    test('dec(); dec(); throws', () => {
        expect(() => {
            const sub = new Sub();
            sub.dec();
            sub.dec();
        }).toThrow();
    });
});

/**
 * Requirement 246
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/246
 */
describe('@demands is evaluated before its associated feature is called', () => {
    const {invariant, demands} = new Contracts(true);

    function nonNegative(this: Foo): boolean {
        return this._value >= 0;
    }

    @invariant
    class Foo {
        protected _value = 0;
    }

    test('true @demands check does not throw', () => {
        class Bar extends Foo {
            @demands(nonNegative)
            method(): number {
                return this._value = -2;
            }
        }

        const bar = new Bar();

        expect(bar.method()).toBe(-2);
    });

    test('false @demands check throws', () => {
        class Bar extends Foo {
            @demands(() => false)
            method(): number {
                return this._value = 12;
            }
        }
        const bar = new Bar();

        expect(() => { bar.method(); }).toThrow();
    });
});

/**
 * Requirement 248
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/248
 */
describe('@demands has a checked mode and unchecked mode', () => {

    test('The associated assertion is evaluated when checkMode = true', () => {
        const {invariant, demands} = new Contracts(true);

        @invariant
        class Foo {
            @demands(() => false)
            method(): void {}
        }

        expect(() => new Foo().method()).toThrow();
    });

    test('The associated assertion is NOT evaluated in checkMode = false', () => {
        const {invariant, demands} = new Contracts(false);

        @invariant
        class Foo {
            @demands(() => false)
            method(): void {}
        }

        expect(() => new Foo().method()).not.toThrow();
    });
});

/**
 * Requirement 396
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/396
 */
describe('Preconditions cannot be strengthened in a subtype', () => {
    const {invariant, demands, override} = new Contracts(true);

    @invariant
    class Base {
        @demands((value: number) => 10 <= value && value <= 30)
        method(value: number): number { return value; }
    }

    test('Base precondition', () => {
        const base = new Base();

        expect(base.method(15)).toBe(15);
        expect(() => base.method(5)).toThrow(
            'Precondition failed on Base.prototype.method'
        );
        expect(() => base.method(35)).toThrow(
            'Precondition failed on Base.prototype.method'
        );
    });

    class Weaker extends Base {
        @override
        @demands((value: number) => 1 <= value && value <= 50)
        method(value: number): number { return value; }
    }

    test('Weaker precondition', () => {
        const weaker = new Weaker();

        expect(weaker.method(15)).toBe(15);
        expect(weaker.method(5)).toBe(5);
        expect(weaker.method(35)).toBe(35);
        expect(() => weaker.method(0)).toThrow(
            'Precondition failed on Weaker.prototype.method'
        );
        expect(() => weaker.method(60)).toThrow(
            'Precondition failed on Weaker.prototype.method'
        );
    });

    class Stronger extends Base {
        @override
        @demands((value: number) => 15 <= value && value <= 20)
        method(value: number): number { return value; }
    }

    test('Stronger precondition', () => {
        const stronger = new Stronger();

        expect(stronger.method(15)).toBe(15);
        expect(() => stronger.method(5)).toThrow(
            'Precondition failed on Stronger.prototype.method'
        );
        expect(() => stronger.method(35)).toThrow(
            'Precondition failed on Stronger.prototype.method'
        );
        expect(stronger.method(25)).toBe(25);
    });
});

/**
 * Requirement 539
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/539
 */
describe('A class feature with a decorator must not be functional until the @invariant is defined', () => {
    const {invariant, demands} = new Contracts(true);

    @invariant
    class Okay {
        @demands((value: number) => 10 <= value && value <= 30)
        method(value: number): number { return value; }
    }

    test('Valid declaration', () => {
        const okay = new Okay();

        expect(okay.method(15)).toBe(15);
    });

    class Fail {
        @demands((value: number) => 10 <= value && value <= 30)
        method(value: number): number { return value; }
    }

    test('Invalid declaration', () => {
        const fail = new Fail();

        expect(() => fail.method(15)).toThrow(MSG_INVARIANT_REQUIRED);
    });
});