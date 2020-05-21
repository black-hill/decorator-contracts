/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import MemberDecorator from './MemberDecorator';
import type {PredicateType} from './typings/PredicateType';
import Assertion from './Assertion';
import { MSG_INVALID_DECORATOR } from './Messages';
import isClass from './lib/isClass';

const assert: Assertion['assert'] = new Assertion(true).assert;

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
        const {checkMode} = this;
        assert(typeof predicate == 'function', MSG_INVALID_DECORATOR);
        assert(!isClass(predicate), MSG_INVALID_DECORATOR);

        return function(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
            const registration = MemberDecorator.registerMember(target, propertyKey, descriptor);

            if(checkMode) {
                registration.demands.push(predicate);
            }

            return descriptor;
        };
    }
}