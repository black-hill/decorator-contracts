/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import Assertion from './Assertion';
import DescriptorWrapper from './lib/DescriptorWrapper';
import { FeatureRegistration } from './lib/FeatureRegistry';
import type { Constructor } from './typings/Constructor';
import { CLASS_REGISTRY } from './lib/ClassRegistry';
import { MSG_NO_STATIC, MSG_DECORATE_METHOD_ACCESSOR_ONLY, MSG_CONTRACTED } from './Messages';
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

    static registerMember(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): FeatureRegistration {
        assert(typeof target != 'function', MSG_NO_STATIC, TypeError);
        // Potentially undefined in pre ES5 environments (compilation target)
        assert(descriptor != null, MSG_DECORATE_METHOD_ACCESSOR_ONLY, TypeError);

        const Class = target.constructor as Constructor<any> & {[IS_CONTRACTED]: boolean},
              registry = CLASS_REGISTRY.getOrCreate(Class);

        assert(Class[IS_CONTRACTED] == true, MSG_CONTRACTED);

        return registry.featureRegistry.getOrCreate(propertyKey, descriptor);
    }
}