/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import Assertion from './Assertion';
import { CLASS_REGISTRY } from './lib/ClassRegistry';
import type {Constructor} from './typings/Constructor';
import getAncestry from './lib/getAncestry';

/**
 * The ContractHandler manages the registration and evaluation of contracts associated with a class
 */
class ContractHandler {
    /**
     * Constructs a new instance of the ContractHandler
     * @param {Assertion.prototype.assert} _assert - The assertion implementation associated with the current checkMode
     */
    constructor(
        protected readonly _assert: typeof Assertion.prototype.assert
    ) { }

    /**
     * Evaluates all registered invariants
     *
     * @param {object} self - The context class
     */
    assertInvariants(self: object): void {
        const ancestry = getAncestry(self.constructor as Constructor<any>);
        ancestry.forEach(Cons => {
            const invariants = CLASS_REGISTRY.get(Cons)?.invariants ?? [];
            invariants.forEach(invariant =>
                this._assert(invariant.apply(self), `Invariant violated. ${invariant.name}: ${invariant.toString()}`)
            );
        });
    }

    /**
     * The handler trap for getting property values
     *
     * @param {object} target - The target object
     * @param {PropertyKey} propertyKey - The name or Symbol  of the property to get
     * @returns {any} - The result of executing 'get' on the target
     */
    get(target: object, propertyKey: PropertyKey): any {
        this.assertInvariants(target);
        const result = Reflect.get(target, propertyKey);

        if(typeof result == 'function') {
            return (...args: any[]): any => {
                try {
                    const value = result.apply(target, args);
                    this.assertInvariants(target);

                    return value;
                } catch(error) {
                    this.assertInvariants(target);

                    throw error;
                }
            };
        } else {
            this.assertInvariants(target);

            return result;
        }
    }

    /**
     * The handler trap for setting property values
     *
     * @param {object} target - The target object
     * @param {PropertyKey} propertyKey - The name or Symbol of the property to set
     * @param {any} value - The new value of the property to set.
     * @returns {boolean} - The result of executing 'set' on the target
     */
    set(target: object, propertyKey: PropertyKey, value: any): boolean {
        this.assertInvariants(target);
        const result = Reflect.set(target, propertyKey, value);
        this.assertInvariants(target);

        return result;
    }
}

export default ContractHandler;