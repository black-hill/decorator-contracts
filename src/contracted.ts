/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import { Constructor } from './typings/Constructor';
import OverrideDecorator from './OverrideDecorator';
import { CLASS_REGISTRY } from './lib/ClassRegistry';

const classProxyHandler: ProxyHandler<any> = {
    construct(Target, args, NewTarget) {
        const registration = CLASS_REGISTRY.getOrCreate(NewTarget),
              {ancestry} = registration;

        ancestry.reverse().forEach(Cons => {
            const registration = CLASS_REGISTRY.getOrCreate(Cons);

            if(registration.overridesChecked == false) {
                OverrideDecorator.checkOverrides(Cons);
                registration.overridesChecked = true;
            }
        });

        const instance = Reflect.construct(Target, args, NewTarget);
        // FIXME: throws
        //registration.contractHandler.assertInvariants(instance);

        return new Proxy(instance, registration.contractHandler);
    }
},
IS_CONTRACTED = Symbol('Is Contracted');

/**
 * Enables code contracts for the extended class.
 * Accepts an optional Base class.
 *
 * @param {T} [Base] - The base class to extend
 * @returns {T} - returns the contracted class
 * @example
 * class List extends contracted(Array) {...}
 * class Bool extends contracted() {...}
 */
function contracted<T extends Constructor<any>>(Base?: T): T {
    const ClassProxy = Base == undefined ?
        new Proxy(class Contracted { static [IS_CONTRACTED] = true; }, classProxyHandler) :
        new Proxy(class Contracted extends Base { static [IS_CONTRACTED] = true; }, classProxyHandler);

    return ClassProxy as T;
}

export {IS_CONTRACTED};
export default contracted;