/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import Assertion from './Assertion';
import {CLASS_REGISTRY} from './lib/ClassRegistry';
import type {Constructor} from './typings/Constructor';
import { FeatureRegistration } from 'lib/FeatureRegistry';
import { PredicateType } from 'typings/PredicateType';
import { RescueType } from 'typings/RescueType';
import { MSG_SINGLE_RETRY } from 'Messages';

const assert: Assertion['assert'] = new Assertion(true).assert;

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
        const Class = self.constructor as Constructor<any>,
            registry = CLASS_REGISTRY.getOrCreate(Class);
        registry.ancestry.forEach(Cons => {
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
        const {assertInvariants} = this;
        assertInvariants(target);
        const result = Reflect.get(target, propertyKey);

        if(typeof result == 'function') {
            const Class = target.constructor as Constructor<any>,
                  registry = CLASS_REGISTRY.getOrCreate(Class),
                  ancFeatureRegistries = registry.ancestry.map(Class =>
                      CLASS_REGISTRY.getOrCreate(Class).featureRegistry.get(propertyKey)
                  ).filter(f => f != undefined) as FeatureRegistration[],
                  [allDemands, allEnsures, fnRescue] = ancFeatureRegistries
                    .reduce<[PredicateType[][], PredicateType[][], RescueType?]>(
                      (sum, next) => [
                            sum[0].concat(next.demands),
                            sum[1].concat(next.ensures),
                            sum[2] ?? next.rescue
                      ],[[],[],]
                  ),
                  demandsError = `Precondition failed on ${Class.name}.prototype.${String(propertyKey)}`,
                  ensuresError = `Postcondition failed on ${Class.name}.prototype.${String(propertyKey)}`;

            return function _checkedFeature(this: object, ...args: any[]): any {
                try {
                    if(allDemands.length > 0) {
                        assert(
                            allDemands.some(
                                demands => demands.every(
                                    demand => demand.apply(this, args)
                                )
                            ),
                            demandsError
                        );
                    }
                    let returnValue;
                    try {
                        returnValue = result.apply(this, args);
                        if(allEnsures.length > 0) {
                            assert(
                                allEnsures.every(
                                    ensures => ensures.every(
                                        ensure => ensure.apply(this, args)
                                    )
                                ),
                                ensuresError
                            );
                        }
                    } catch(error) {
                        if(fnRescue == null) {
                            throw error;
                        }
                        let hasRetried = false;
                        fnRescue.call(this, error, args, (...retryArgs: any[]) => {
                            assert(!hasRetried, MSG_SINGLE_RETRY);
                            hasRetried = true;
                            returnValue = _checkedFeature.call(this, ...retryArgs);
                        });
                        if(!hasRetried) {
                            throw error;
                        }
                    }
                    assertInvariants(target);

                    return returnValue;
                } catch(error) {
                    assertInvariants(target);

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