/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import Assertion from './Assertion';
import isClass from './lib/isClass';
import { CLASS_REGISTRY } from './lib/ClassRegistry';
import type { Constructor } from './typings/Constructor';
import { PredicateType } from './typings/PredicateType';
import { MSG_INVALID_DECORATOR, MSG_CONTRACTED } from './Messages';
import { IS_CONTRACTED } from './contracted';

const assert: Assertion['assert'] = new Assertion(true).assert;

/**
 * The `@invariant` decorator describes and enforces the properties of a class
 * via assertions. These assertions are checked after the associated class
 * is constructed, before and after every method execution, and before and after
 * every accessor usage (get/set).
 */
export default class InvariantDecorator {
    constructor(protected checkMode: boolean) {
        this.invariant = this.invariant.bind(this);
    }

    /**
     * The `@invariant` decorator describes and enforces the properties of a class
     * via assertions. These assertions are checked after the associated class
     * is constructed, before and after every method execution, and before and after
     * every accessor usage (get/set).
     *
     * @param {PredicateType} predicate - The assertion to apply to the class
     * @returns {ClassDecorator} - The Class Decorator
     */
    invariant(predicate: PredicateType): ClassDecorator {
        const checkMode = this.checkMode;

        assert(typeof predicate == 'function', MSG_INVALID_DECORATOR);

        /**
         * The class decorator
         *
         * @param {Constructor<any>} Class - The class being decorated
         * @returns {Constructor<any>} - The original class
         */
        function decorator(Class: Constructor<any>): Constructor<any> {
            assert(isClass(Class), MSG_INVALID_DECORATOR);
            assert((Class as any)[IS_CONTRACTED] == true, MSG_CONTRACTED);

            const registration = CLASS_REGISTRY.getOrCreate(Class);

            if(checkMode) {
                registration.invariants.push(predicate);
            }

            return Class;
        }

        return decorator as ClassDecorator;
    }
}