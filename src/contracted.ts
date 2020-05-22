/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import { Constructor } from './typings/Constructor';
import getAncestry from './lib/getAncestry';
import OverrideDecorator from './OverrideDecorator';
import MemberDecorator from './MemberDecorator';
import { CLASS_REGISTRY } from './lib/ClassRegistry';

const classProxyHandler: ProxyHandler<any> = {
    construct(target, args, newTarget) {
        const registration = CLASS_REGISTRY.getOrCreate(newTarget),
              ancestry = getAncestry(newTarget).reverse();

        ancestry.forEach(Cons => {
            const registration = CLASS_REGISTRY.getOrCreate(Cons);

            if(!registration.isRestored) {
                OverrideDecorator.checkOverrides(Cons);
                MemberDecorator.restoreFeatures(Cons);
                registration.isRestored = true;
            }
        });

        // https://stackoverflow.com/a/43104489/153209
        const instance = Reflect.construct(target, args, newTarget);
        registration.contractHandler.assertInvariants(instance);

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

////////////////////