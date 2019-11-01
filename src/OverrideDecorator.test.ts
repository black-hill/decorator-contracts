/**
 * @license
 * Copyright (C) #{YEAR}# Michael L Haufe
 * SPDX-License-Identifier: AGPL-1.0-only
 *
 * Unit tests for the override decorator
 */

import Contracts from './';
import { MSG_NO_MATCHING_MEMBER, MSG_INVALID_ARG_LENGTH, MSG_DUPLICATE_OVERRIDE } from './OverrideDecorator';

/**
 * Requirement 210
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/210
 */
describe('The override decorator is a non-static member decorator only', () => {
    let {override} = new Contracts(true);

    test('class decorator throws', () => {
        expect(() => {
            // @ts-ignore: Ignoring type error for JS test
            @override
            class Base {}

            return Base;
        }).toThrow();
    });

    test('static method decorator throws', () => {
        expect(() => {
            class Base {
                @override
                static method() {}
            }

            return Base;
        }).toThrow();
    });

    test('instance method decorator does not throw', () => {
        expect(() => {
            class Base {
                method() {}
            }

            class Sub extends Base {
                @override
                method() {}
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
    let {override} = new Contracts(false);

    test('base class with @override decorator', () => {
        expect(() => {
            class Base {
                @override
                method() {}
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
    let {override} = new Contracts(true);

    test('base class with @override decorator', () => {
        expect(() => {
            class Base {
                @override
                method() {}
            }

            return Base;
        }).toThrow(MSG_NO_MATCHING_MEMBER);
    });

    test('subclass with @override decorator', () => {
        expect(() => {
            class Base {}

            class Sub extends Base {
                @override
                method() {}
            }

            return Sub;
        }).toThrow(MSG_NO_MATCHING_MEMBER);
    });

    test('subclass with method overriding non-method', () => {
        expect(() => {
            class Base {
                method = 'foo';
            }

            class Sub extends Base {
                @override
                // @ts-ignore: Ignoring type error for JS check
                method() {}
            }

            return Sub;
        }).toThrow(MSG_NO_MATCHING_MEMBER);
    });
});

/**
 * Requirement 214
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/214
 */
describe('using @override on a method with an ancestor with a different parameter count is an error', () => {
    let {override} = new Contracts(true);

    test('bad override', () => {
        expect(() => {
            class Base {
                method(a: string, b: string) {
                    console.log(`${a}, ${b}`);
                }
            }

            class Sub extends Base {
                @override
                method(a: string) {
                    console.log(a);
                }
            }

            return Sub;
        }).toThrow(MSG_INVALID_ARG_LENGTH);
    });

    test('bad override 2', () => {
        expect(() => {
            class Base {
                method(a: string) {
                    console.log(`${a}`);
                }
            }

            class Sub extends Base {
                @override
                // @ts-ignore: type error for JS test
                method(a: string, b: string) {
                    console.log(`${a}, ${b}`);
                }
            }

            return Sub;
        }).toThrow(MSG_INVALID_ARG_LENGTH);
    });

    test('good override', () => {
        expect(() => {
            class Base {
                method(a: string, b: string) {
                    console.log(`${a}, ${b}`);
                }
            }

            class Sub extends Base {
                @override
                method(a: string, b: string) {
                    super.method(a, b);
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
    let {invariant, override} = new Contracts(true);

    test('@override defined', () => {
        expect(() => {
            @invariant
            class Base {
                method() {}

                get foo() { return 3; }
            }

            class Sub extends Base {
                @override
                method() {}

                @override
                get foo() { return 4; }
            }

            return new Sub();
        }).not.toThrow();
    });

    test('@override missing', () => {
        expect(() => {
            @invariant
            class Base {
                method() {}
            }

            class Sub extends Base {
                method() {}
            }

            return new Sub();
        }).toThrow(`@override decorator missing on Sub.method`);

        expect(() => {
            @invariant
            class Base {
                get prop() { return 3; }
            }

            class Sub extends Base {
                get prop() { return 5; }
            }

            return new Sub();
        });
    });
});

/**
 * Requirement 337
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/337
 */
describe('Only a single @override can be assigned to a member per class', () => {
    let {override} = new Contracts(true);

    test('duplicate @override', () => {
        expect(() => {
            class Base {
                method(a: string, b: string) {
                    console.log(`${a}, ${b}`);
                }
            }

            class Sub extends Base {
                @override
                @override
                method(a: string, b: string) {
                    super.method(a, b);
                }
            }

            return Sub;
        }).toThrow(MSG_DUPLICATE_OVERRIDE);
    });

    test('Three level @override', () => {
        expect(() => {
            class Base {
                method(a: string, b: string) {
                    console.log(`${a}, ${b}`);
                }
            }

            class Sub extends Base {
                @override
                method(a: string, b: string) {
                    super.method(a, b);
                }
            }

            class SubSub extends Sub {
                @override
                method(a: string, b: string) {
                    super.method(a, b);
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
    let {invariant, override} = new Contracts(true);

    test('instance accessor decorator does not throw', () => {
        expect(() => {
            @invariant
            class Base {
                private _value_: number = 0;
                get value() { return this._value_; }
                set value(x: number) { this._value_ = x; }
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
            @invariant
            class Base {
                private _value_: number = 0;
                get value() { return this._value_; }
                set value(x: number) { this._value_ = x; }
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