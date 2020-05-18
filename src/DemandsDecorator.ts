/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import MemberDecorator from './MemberDecorator';
import type {PredicateType} from './typings/PredicateType';
import { Constructor } from './typings/Constructor';
import Assertion from './Assertion';
import { MSG_INVALID_DECORATOR, MSG_NO_STATIC, MSG_DECORATE_METHOD_ACCESSOR_ONLY } from './Messages';
import { CLASS_REGISTRY } from './lib/ClassRegistry';

/**
 * The `@demands` decorator is an assertion of a precondition.
 * It expresses a condition that must be true before the associated class member is executed.
 */
export default class DemandsDecorator extends MemberDecorator {
    /**
     * Constructs a new instance of the DemandsDecorator in the specified mode
     * Enabled when checkMode is true, and disabled otherwise
     *
     * @param {boolean} checkMode - The flag representing mode of the assertion
     */
    constructor(protected checkMode: boolean) {
        super(checkMode);
        this.demands = this.demands.bind(this);
    }

    /**
     * The `@demands` decorator is an assertion of a precondition.
     * It expresses a condition that must be true before the associated class member is executed.
     *
     * @param {PredicateType} predicate - The assertion
     * @returns {MethodDecorator} - The Method Decorator
     */
    demands(predicate: PredicateType): MethodDecorator {
        const checkMode = this.checkMode,
            assert: Assertion['assert'] = this._assert;
        this._checkedAssert(typeof predicate == 'function', MSG_INVALID_DECORATOR);

        return function(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
            const isStatic = typeof target == 'function';
            assert(!isStatic, MSG_NO_STATIC, TypeError);
            // Potentially undefined in pre ES5 environments (compilation target)
            assert(descriptor != null, MSG_DECORATE_METHOD_ACCESSOR_ONLY, TypeError);

            if(!checkMode) {
                return descriptor;
            }

            const Clazz = target.constructor as Constructor<any>,
                registry = CLASS_REGISTRY.getOrCreate(Clazz),
                registration = registry.featureRegistry.getOrCreate(propertyKey, descriptor);

            registration.demands.push(predicate);

            return descriptor;
        };
    }
}