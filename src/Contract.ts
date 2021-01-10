/*!
 * @license
 * Copyright (C) 2020 Final Hill LLC
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import deepFreeze from './lib/deepFreeze';

const invariant = Symbol('invariant');

type AnyObject = Record<PropertyKey, any>;
type AnyFunc = (...args: any[]) => any;

type NonFunctionPropertyNames<T extends AnyObject> = { [K in keyof T]: T[K] extends AnyFunc ? never : K }[keyof T];
type Properties<T extends AnyObject> = Pick<T, NonFunctionPropertyNames<T>>;

type Invariant<T extends AnyObject> = (self: T) => boolean;
type Demands<T extends AnyObject, F extends T[any]> = (self: T, ...args: Parameters<F>) => boolean;
type Ensures<T extends AnyObject, F extends T[any]> = (self: T, old: Properties<T>, ...args: Parameters<F>) => boolean;
type Rescue<T extends AnyObject, F extends T[any]> = (self: T, error: Error, args: Parameters<F>, retry: (...args: Parameters<F>) => void) => void;

interface InvariantContract<T extends AnyObject> {
    [invariant]?: Invariant<T> | Invariant<T>[];
}

interface FeatureContract<T extends AnyObject, F> {
    demands?: Demands<T,F> | Demands<T,F>[];
    ensures?: Ensures<T,F> | Ensures<T,F>[];
    rescue?: Rescue<T,F> | Rescue<T,F>[];
}

export type ContractOptions<T extends AnyObject> = InvariantContract<T> & {
    [K in keyof T]?: FeatureContract<T, T[K]>
};

class Contract<T extends AnyObject> {
    readonly assertions: ContractOptions<T> = Object.create(null);

    constructor(assertions: ContractOptions<T> = {}) {
        Object.assign(this.assertions,assertions);
        deepFreeze(this.assertions);
    }
}

export {Contract, invariant};
export default Contract;