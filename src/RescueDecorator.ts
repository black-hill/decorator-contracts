/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import MemberDecorator from './MemberDecorator';
import isClass from './lib/isClass';
import type { RescueType } from './typings/RescueType';
import Assertion from './Assertion';
import { MSG_INVALID_DECORATOR, MSG_DUPLICATE_RESCUE } from './Messages';

const assert: Assertion['assert'] = new Assertion(true).assert;

/**
 * The `rescue` decorator enables a mechanism for providing Robustness.
 * It intercepts exceptions and provides a means to retry the
 * execution of the associated feature or to rethrow.
 */
export default class RescueDecorator extends MemberDecorator {
    /**
     * Returns an instance of the 'rescue' decorator in the specified mode.
     * When checkMode is true the decorator is enabled.
     * When checkMode is false the decorator has no effect
     *
     * @param {boolean} checkMode - A flag representing mode of the decorator
     */
    constructor(protected checkMode: boolean) {
        super(checkMode);
        this.rescue = this.rescue.bind(this);
    }

    /**
     * The `rescue` decorator enables a mechanism for providing Robustness.
     * It intercepts exceptions and provides a means to retry the
     * execution of the associated feature or to rethrow.
     *
     * @param {RescueType} fnRescue - The rescue function
     * @returns {MethodDecorator} - The MethodDecorator
     */
    rescue(fnRescue: RescueType): MethodDecorator {
        const {checkMode} = this;
        assert(typeof fnRescue == 'function', MSG_INVALID_DECORATOR);
        assert(!isClass(fnRescue), MSG_INVALID_DECORATOR);

        return function(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
            const registration = MemberDecorator.registerMember(target, propertyKey, descriptor);
            assert(registration.rescue == null, MSG_DUPLICATE_RESCUE);

            if(checkMode) {
                registration.rescue = fnRescue;
            }

            return descriptor;
        };
    }
}