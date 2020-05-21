/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import Assertion from './Assertion';
import DescriptorWrapper from './lib/DescriptorWrapper';
import { FeatureRegistration } from './lib/FeatureRegistry';
import getAncestry from './lib/getAncestry';
import type { Constructor } from './typings/Constructor';
import { CLASS_REGISTRY } from './lib/ClassRegistry';
import { MSG_SINGLE_RETRY, MSG_NO_STATIC, MSG_DECORATE_METHOD_ACCESSOR_ONLY, MSG_EXTEND_CONTRACTED } from './Messages';
import { IS_CONTRACTED } from './contracted';

const assert: Assertion['assert'] = new Assertion(true).assert;

export default abstract class MemberDecorator {
    protected _assert: Assertion['assert'];
    protected _checkedAssert: Assertion['assert'] = new Assertion(true).assert;
    protected _uncheckedAssert: Assertion['assert'] = new Assertion(false).assert;

    /**
     * Returns an instance of the decorator in the specified mode.
     * When checkMode is true the decorator is enabled.
     * When checkMode is false the decorator has no effect
     *
     * @param {boolean} checkMode - A flag representing mode of the decorator
     */
    constructor(protected checkMode: boolean) {
        this._assert = checkMode ? this._checkedAssert : this._uncheckedAssert;
    }

    /**
     * Finds the nearest ancestor feature for the given propertyKey by walking the prototype chain of the target
     *
     * @param {any} targetProto - The prototype of the object
     * @param {PropertyKey} propertyKey - The name of the feature to search for
     * @returns {DescriptorWrapper | null} = The DescriptorWrapper if it exists
     */
    static ancestorFeature(targetProto: any, propertyKey: PropertyKey): DescriptorWrapper | null {
        const proto = Object.getPrototypeOf(targetProto);
        if(proto == null) {
            return null;
        }

        const {featureRegistry} = CLASS_REGISTRY.getOrCreate(proto.constructor),
            descriptorWrapper = featureRegistry.has(propertyKey) ?
                featureRegistry.get(propertyKey)!.descriptorWrapper :
                new DescriptorWrapper(Object.getOwnPropertyDescriptor(proto, propertyKey)!);

        return descriptorWrapper.hasDescriptor ? descriptorWrapper : this.ancestorFeature(proto, propertyKey);
    }

    /**
     * Returns the feature names defined on the provided prototype and its ancestors
     *
     * @param {object} targetProto - The prototype
     * @returns {Set<PropertyKey>} - The feature names
     */
    static ancestorFeatureNames(targetProto: object): Set<PropertyKey> {
        if(targetProto == null) {
            return new Set();
        }
        const proto = Object.getPrototypeOf(targetProto);

        return proto == null ? new Set() :
            new Set([...this.featureNames(proto), ...this.ancestorFeatureNames(proto)]);
    }

    /**
     * Returns the feature names associated with the provided prototype
     *
     * @param {object} proto - The prototype
     * @returns {Set<PropertyKey>} - The feature names
     */
    static featureNames(proto: object): Set<PropertyKey> {
        return proto == null ? new Set() : new Set(
            Object.entries(Object.getOwnPropertyDescriptors(proto))
                .filter(([key, descriptor]) => {
                    const dw = new DescriptorWrapper(descriptor);

                    return (dw.isMethod || dw.isAccessor) && key != 'constructor';
                })
                .map(([key]) => key)
        );
    }

    static getAncestorRegistration(Class: Constructor<any>, propertyKey: PropertyKey): FeatureRegistration | undefined {
        const Base = Object.getPrototypeOf(Class),
            ancestry = getAncestry(Base),
            AncestorRegistryClass = ancestry.find(Class =>
                CLASS_REGISTRY.getOrCreate(Class).featureRegistry.has(propertyKey)
            ),
            ancestorRegistry = AncestorRegistryClass != null ? CLASS_REGISTRY.getOrCreate(AncestorRegistryClass).featureRegistry : null;

        return ancestorRegistry?.get(propertyKey);
    }

    static getAncestorRegistrations(Class: Constructor<any>, propertyKey: PropertyKey): FeatureRegistration[] {
        const Base = Object.getPrototypeOf(Class),
            ancestry = getAncestry(Base);

        return ancestry.filter(Class =>
            CLASS_REGISTRY.getOrCreate(Class).featureRegistry.has(propertyKey)
        ).map(Class => CLASS_REGISTRY.getOrCreate(Class).featureRegistry.get(propertyKey)!);
    }

    /**
     * Decorated class features are replaced with the fnInvariantRequired definition.
     * This method restores the original descriptor.
     *
     * @param {Constructor<any>} Clazz - The class
     */
    static restoreFeatures(Clazz: Constructor<any>): void {
        const proto = Clazz.prototype;
        if(proto == null) {
            return;
        }

        // TODO: optimize
        const {featureRegistry} = CLASS_REGISTRY.getOrCreate(Clazz);
        featureRegistry.forEach((registration, propertyKey) => {
            const {descriptorWrapper} = registration,
                ancRegistries = this.getAncestorRegistrations(Clazz, propertyKey),
                allDemands = [registration.demands, ...ancRegistries.map(r => r.demands)].filter(r => r.length > 0),
                allEnsures = [registration.ensures, ...ancRegistries.map(r => r.ensures)].filter(r => r.length > 0),
                fnRescue = registration.rescue,
                originalDescriptor = descriptorWrapper.descriptor!,
                newDescriptor = {...originalDescriptor},
                // TODO: more specific error. Want the specific class name, feature name, and expression
                demandsError = `Precondition failed on ${Clazz.name}.prototype.${String(propertyKey)}`,
                ensuresError = `Postcondition failed on ${Clazz.name}.prototype.${String(propertyKey)}`,

                checkedFeature = (feature: Function) => function _checkedFeature(this: typeof Clazz, ...args: any[]): any {
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

                    let result;
                    try {
                        result = feature.apply(this, args);
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
                            result = _checkedFeature.call(this, ...retryArgs);
                        });
                        if(!hasRetried) {
                            throw error;
                        }
                    }

                    return result;
                };

            if(descriptorWrapper.isMethod) {
                const feature: Function = originalDescriptor.value;
                newDescriptor.value = checkedFeature(feature);
            } else if(descriptorWrapper.isAccessor) {
                if(descriptorWrapper.hasGetter) {
                    const feature: Function = originalDescriptor.get!;
                    newDescriptor.get = checkedFeature(feature);
                }
                if(descriptorWrapper.hasSetter) {
                    const feature: Function = originalDescriptor.set!;
                    newDescriptor.set = checkedFeature(feature);
                }
            } else {
                throw new Error(`Unhandled condition. Unable to restore ${Clazz.name}.prototype.${String(propertyKey)}`);
            }

            Object.defineProperty(proto, propertyKey, newDescriptor);
        });
    }

    static registerMember(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): FeatureRegistration {
        assert(typeof target != 'function', MSG_NO_STATIC, TypeError);
        // Potentially undefined in pre ES5 environments (compilation target)
        assert(descriptor != null, MSG_DECORATE_METHOD_ACCESSOR_ONLY, TypeError);

        const Class = target.constructor as Constructor<any> & {[IS_CONTRACTED]: boolean},
              registry = CLASS_REGISTRY.getOrCreate(Class);

        assert(Class[IS_CONTRACTED] == true, MSG_EXTEND_CONTRACTED);

        return registry.featureRegistry.getOrCreate(propertyKey, descriptor);
    }
}