/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import { Constructor } from 'typings/Constructor';

const classProxyHandler: ProxyHandler<any> = {
    construct(target, args, newTarget) {
        const instance = Reflect.construct(target, args, newTarget);

        return new Proxy(instance, instanceHandler);
    }
},
instanceHandler: ProxyHandler<any> = {

};

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
        new Proxy(class Contracted{}, classProxyHandler) :
        new Proxy(class Contracted extends Base{}, classProxyHandler);

    return ClassProxy as T;
}

export default contracted;