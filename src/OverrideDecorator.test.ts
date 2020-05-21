/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import { Contracts, contracted } from './';
import { MSG_NO_MATCHING_FEATURE, MSG_INVALID_ARG_LENGTH, MSG_DUPLICATE_OVERRIDE, MSG_EXTEND_CONTRACTED } from './Messages';

/**
 * Requirement 210
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/210
 */
describe('The override decorator is a non-static member decorator only', () => {
    const {override} = new Contracts(true);

    test('class decorator throws', () => {
        expect(() => {
            // @ts-ignore: Ignoring type error for JS test
            @override
            class Base extends contracted() {}

            return Base;
        }).toThrow();
    });

    test('static method decorator throws', () => {
        expect(() => {
            class Base extends contracted() {
                @override
                static method(): void {}
            }

            return Base;
        }).toThrow();
    });

    test('instance method decorator does not throw', () => {
        expect(() => {
            class Base extends contracted() {
                method(): void {}
            }

            class Sub extends Base {
                @override
                method(): void {}
            }

            return Sub;
        }).not.toThrow();
    });
});

/**
 * Requirement 211
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/211
 */
describe('In production mode the @override decorator is a no-op', () => {
    const {override} = new Contracts(false);

    test('base class with @override decorator', () => {
        expect(() => {
            class Base extends contracted() {
                @override
                method(): void {}
            }

            return Base;
        }).not.toThrow();
    });
});

/**
 * Requirement 212
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/212
 */
describe('Using @override on a class member with no ancestor member is an error', () => {
    const {override} = new Contracts(true);

    test('base class with @override decorator', () => {
        expect(() => {
            class Base extends contracted() {
                @override
                method(): void {}
            }

            return Base;
        }).toThrow(MSG_NO_MATCHING_FEATURE);
    });

    test('subclass with @override decorator', () => {
        expect(() => {
            class Base extends contracted() {}

            class Sub extends Base {
                @override
                method(): void {}
            }

            return Sub;
        }).toThrow(MSG_NO_MATCHING_FEATURE);
    });

    test('subclass with method overriding non-method', () => {
        expect(() => {
            class Base extends contracted() {
                method = 'foo';
            }

            class Sub extends Base {
                @override
                // @ts-ignore: Ignoring type error for JS check
                method(): void {}
            }

            return Sub;
        }).toThrow(MSG_NO_MATCHING_FEATURE);
    });
});

/**
 * Requirement 214
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/214
 */
describe('using @override on a method with an ancestor with a different parameter count is an error', () => {
    const {override} = new Contracts(true);

    test('bad override', () => {
        expect(() => {
            class Base extends contracted() {
                method(a: string, b: string): string {
                    return `${a}, ${b}`;
                }
            }

            class Sub extends Base {
                @override
                method(a: string): string {
                    return a;
                }
            }

            return Sub;
        }).toThrow(MSG_INVALID_ARG_LENGTH);
    });

    test('bad override 2', () => {
        expect(() => {
            class Base extends contracted() {
                method(a: string): string {
                    return `${a}`;
                }
            }

            class Sub extends Base {
                @override
                // @ts-ignore: type error for JS test
                method(a: string, b: string): string {
                    return `${a}, ${b}`;
                }
            }

            return Sub;
        }).toThrow(MSG_INVALID_ARG_LENGTH);
    });

    test('good override', () => {
        expect(() => {
            class Base extends contracted() {
                method(a: string, b: string): string {
                    return `${a}, ${b}`;
                }
            }

            class Sub extends Base {
                @override
                method(a: string, b: string): string {
                    return super.method(a, b);
                }
            }

            return Sub;
        }).not.toThrow();
    });

});

/**
 * Requirement 215
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/215
 */
describe('A subclass with an overriding member missing @override is an error', () => {
    const {override} = new Contracts(true);

    test('@override defined', () => {
        expect(() => {
            class Base extends contracted() {
                method(): void {}

                get foo(): number { return 3; }
            }

            class Sub extends Base {
                @override
                method(): void {}

                @override
                get foo(): number { return 4; }
            }

            return new Sub();
        }).not.toThrow();
    });

    test('@override missing', () => {
        expect(() => {
            class Base extends contracted() {
                method(): void {}
            }

            class Sub extends Base {
                method(): void {}
            }

            return new Sub();
        }).toThrow('@override decorator missing on Sub.method');

        expect(() => {
            class Base extends contracted() {
                get prop(): number { return 3; }
            }

            class Sub extends Base {
                get prop(): number { return 5; }
            }

            return new Sub();
        }).toThrow('@override decorator missing on Sub.prop');
    });
});

/**
 * Requirement 337
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/337
 */
describe('Only a single @override can be assigned to a member per class', () => {
    const {override} = new Contracts(true);

    test('duplicate @override', () => {
        expect(() => {
            class Base extends contracted() {
                method(a: string, b: string): string {
                    return `${a}, ${b}`;
                }
            }

            class Sub extends Base {
                @override
                @override
                method(a: string, b: string): string {
                    return super.method(a, b);
                }
            }

            return Sub;
        }).toThrow(MSG_DUPLICATE_OVERRIDE);
    });

    test('Three level @override', () => {
        expect(() => {
            class Base extends contracted() {
                method(a: string, b: string): string {
                    return `${a}, ${b}`;
                }
            }

            class Sub extends Base {
                @override
                method(a: string, b: string): string {
                    return super.method(a, b);
                }
            }

            class SubSub extends Sub {
                @override
                method(a: string, b: string): string {
                    return super.method(a, b);
                }
            }

            return SubSub;
        }).not.toThrow();
    });
});

/**
 * Requirement 341
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/341
 */
describe('Accessors must support @override', () => {
    const {override} = new Contracts(true);

    test('instance accessor decorator does not throw', () => {
        expect(() => {
            class Base extends contracted() {
                #value = 0;
                get value(): number { return this.#value; }
                set value(x: number) { this.#value = x; }
            }

            class Sub extends Base {
                @override
                set value(x: number) {
                    super.value = x;
                }
            }

            return Sub;
        }).not.toThrow();
    });

    test('bad accessor decorator throws', () => {
        expect(() => {
            class Base extends contracted() {
                #value = 0;
                get value(): number { return this.#value; }
                set value(x: number) { this.#value = x; }
            }

            class Sub extends Base {
                @override
                set foo(x: number) {
                    super.value = x;
                }
            }

            return Sub;
        }).toThrow();
    });
});

/**
 * Requirement 539
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/539
 */
describe('A class feature with a decorator must not be functional until the @invariant is defined', () => {
    const {override} = new Contracts(true);

    class Base extends contracted(){
        method(value: number): number { return value; }
    }

    class Okay extends Base {
        @override
        method(value: number): number { return value; }
    }

    test('Valid declaration', () => {
        const okay = new Okay();

        expect(okay.method(15)).toBe(15);
    });

    class BadBase extends contracted() {
        method(value: number): number { return value; }
    }

    class Fail extends BadBase {
        @override
        method(value: number): number { return value; }
    }

    test('Invalid declaration', () => {
        const fail = new Fail();

        expect(() => fail.method(15)).toThrow(MSG_EXTEND_CONTRACTED);
    });
});