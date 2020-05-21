/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import MemberDecorator from './MemberDecorator';
import Assertion from './Assertion';
import type { Constructor } from './typings/Constructor';
import { CLASS_REGISTRY } from './lib/ClassRegistry';
import { MSG_NO_MATCHING_FEATURE, MSG_DUPLICATE_OVERRIDE, MSG_INVALID_ARG_LENGTH } from './Messages';

const assert: Assertion['assert'] = new Assertion(true).assert;

/**
 * The 'override' decorator asserts that the current class feautre is a specialization or
 * replacement of an ancestor class's feature of the same name and argument count
 */
export default class OverrideDecorator extends MemberDecorator {
    /**
     * Returns an instance of the 'override' decorator in the specified mode.
     * When checkMode is true the decorator is enabled. When checkMode is false the decorator has no effect
     *
     * @param {boolean} checkMode - A flag representing mode of the decorator
     */
    constructor(protected checkMode: boolean) {
        super(checkMode);
        this.override = this.override.bind(this);
    }

    /**
     * Checks the features of the class for missing override decorators
     *
     * @param {Constructor<any>} Class - The class constructor
     */
    static checkOverrides(Class: Constructor<any>): void {
        const proto = Class.prototype;
        if(proto == null) {
            return;
        }

        const {featureRegistry} = CLASS_REGISTRY.getOrCreate(Class),
            featureNames = MemberDecorator.featureNames(proto),
            ancestorFeatureNames = this.ancestorFeatureNames(proto);

        featureNames.forEach(featureName => {
            const registration = featureRegistry.get(featureName);
            assert(
                (registration != null && registration.overrides) || !ancestorFeatureNames.has(featureName),
                `@override decorator missing on ${Class.name}.${String(featureName)}`
            );
        });
    }

    /**
     * The 'override' decorator asserts that the current class feautre is a specialization or
     * replacement of an ancestor class's feature of the same name and argument count
     *
     * @param {object} target - The class
     * @param {PropertyKey} propertyKey - The property key
     * @param {PropertyDescriptor} descriptor - The property descriptor
     * @returns {PropertyDescriptor} - The PropertyDescriptor
     */
    override(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
        const registration = MemberDecorator.registerMember(target, propertyKey, descriptor);

        if(!this.checkMode) {
            return descriptor;
        }

        const dw = registration.descriptorWrapper,
              am = MemberDecorator.ancestorFeature(target, propertyKey);
        assert(am != null && dw.memberType === am.memberType, MSG_NO_MATCHING_FEATURE);

        assert(!registration.overrides, MSG_DUPLICATE_OVERRIDE);
        registration.overrides = true;

        if(dw.isMethod) {
            const thisMethod: Function = dw.value,
                  ancMethod: Function = am!.value;
            assert(thisMethod.length == ancMethod.length, MSG_INVALID_ARG_LENGTH);
        }

        return descriptor;
    }
}