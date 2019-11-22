/**
 * @license
 * Copyright (C) #{YEAR}# Michael L Haufe
 * SPDX-License-Identifier: AGPL-1.0-only
 */

/**
 * DescriptorWrapper is a utility class for inspecting
 * the native PropertyDescriptor
 */
class DescriptorWrapper {
    get hasDescriptor(): boolean {
        return this.descriptor != undefined;
    }

    get hasGetter(): boolean {
        return this.isAccessor && this.descriptor!.get != undefined;
    }

    get hasSetter(): boolean {
        return this.isAccessor && this.descriptor!.set != undefined;
    }

    /**
     * Determines if the descriptor describes a property
     */
    get isProperty() {
        return this.hasDescriptor ?
                typeof this.descriptor!.value != 'function' &&
                    typeof this.descriptor!.value != 'undefined' :
                false;
    }

    /**
     * Determines if the descriptor describes a method
     */
    get isMethod() {
        return this.hasDescriptor ?
            typeof this.descriptor!.value == 'function' :
            false;
    }

    /**
     * Determines if the descriptor describes an accessor
     */
    get isAccessor() {
        return this.hasDescriptor ?
            typeof this.descriptor!.value == 'undefined' :
            false;
    }

    get memberType(): 'method' | 'property' | 'accessor' {
        return this.isMethod ? 'method' :
               this.isProperty ? 'property' :
               'accessor';
    }

    get value() {
        return this.hasDescriptor ? this.descriptor!.value : undefined;
    }

    constructor(public descriptor: PropertyDescriptor | undefined) {}
}

export default DescriptorWrapper;