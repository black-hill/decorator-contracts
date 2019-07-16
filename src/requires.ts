import AssertionError from "./AssertionError";

/**
 * Requires is an assertion of a precondition.
 * It expresses a condition that must be true before the associated class member is executed.
 *
 */
function requiresDebug<Self>(
    fnCondition: (self: Self, ...args: any[]) => boolean,
    message: string = 'Precondition failed') {
    return function(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        let {value, get, set} = descriptor

        if(value != undefined) {
            descriptor.value = function (this: Self, ...args: any[]) {
                let assertion = fnCondition(this, ...args);
                if (!assertion) {
                    throw new AssertionError(message);
                } else {
                    return value.apply(this, args);
                }
            };
        } else {
            if(get != undefined) {
                descriptor.get = function(this: Self) {
                    let assertion = fnCondition(this);
                    if (!assertion) {
                        throw new AssertionError(message);
                    } else {
                        return get!.apply(this);
                    }
                }
            }
            if(set != undefined) {
                descriptor.set = function(this: Self, arg: any) {
                    let assertion = fnCondition(this);
                    if (!assertion) {
                        throw new AssertionError(message);
                    } else {
                        return set!.call(this, arg);
                    }
                }
            }
        }
    }
}

// @ts-ignore: ignoring unused
function requiresProd<Self>(fnCondition: (self: Self, ...args: any[]) => boolean, message: string = 'Precondition failed') {
    return function(_target: any, _propertyKey: string, _descriptor: PropertyDescriptor) {}
}

/**
 *
 * @param debugMode
 */
export default function(debugMode: boolean) {
    let requires = debugMode ? requiresDebug : requiresProd

    return requires
}