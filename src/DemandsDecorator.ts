/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import MemberDecorator from './MemberDecorator';
import DescriptorWrapper from './lib/DescriptorWrapper';
import { PredicateType } from './typings/PredicateType';
import { Constructor } from './typings/Constructor';
import Assertion from './Assertion';
import { MSG_INVALID_DECORATOR, MSG_NO_STATIC } from './Messages';

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
    demands<S extends object>(predicate: PredicateType<S>): MethodDecorator {
        const checkMode = this.checkMode,
            assert: Assertion['assert'] = this._assert;
        this._checkedAssert(typeof predicate == 'function', MSG_INVALID_DECORATOR);

        return function(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
            const isStatic = typeof target == 'function';
            assert(!isStatic, MSG_NO_STATIC, TypeError);

            if(!checkMode) {
                return descriptor;
            }

            const Class = target.constructor as Constructor<any>,
                dw = new DescriptorWrapper(descriptor),
                registration = MemberDecorator.registerFeature(Class, propertyKey, dw);

            registration.demands.push(predicate);

            return dw.descriptor!;
        };
    }
}