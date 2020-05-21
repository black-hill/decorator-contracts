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
 * The `@ensures` decorator is an assertion of a postcondition.
 * It expresses a condition that must be true after the associated class member is executed.
 */
export default class EnsuresDecorator extends MemberDecorator {
    /**
     * Constructs a new instance of the EnsuresDecorator in the specified mode
     * Enabled when checkMode is true, and disabled otherwise
     *
     * @param {boolean} checkMode - The flag representing the mode of the assertion
     */
    constructor(protected checkMode: boolean) {
        super(checkMode);
        this.ensures = this.ensures.bind(this);
    }

    /**
     * The 'ensures' decorator. This is a feature decorator only
     *
     * @param {PredicateType} predicate - The Assertion to test
     * @returns {MethodDecorator} - The method decorator
     * @throws {AssertionError} - Throws an AssertionError if the predicate is not a function
     */
    ensures(predicate: PredicateType): MethodDecorator {
        const {checkMode} = this;
        assert(typeof predicate == 'function', MSG_INVALID_DECORATOR);
        assert(!isClass(predicate), MSG_INVALID_DECORATOR);

        return function(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
            const registration = MemberDecorator.registerMember(target,propertyKey,descriptor);

            if(checkMode) {
                registration.ensures.push(predicate);
            }

            return descriptor;
        };
    }
}