/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import Assertion from './Assertion';
import contracted from './contracted';
import EnsuresDecorator from './EnsuresDecorator';
import InvariantDecorator from './InvariantDecorator';
import OverrideDecorator from './OverrideDecorator';
import DemandsDecorator from './DemandsDecorator';
import RescueDecorator from './RescueDecorator';

/**
 * The Contracts class defines methods that can be used to define and enforce
 * specifications for other classes. These are exposed as decorator factories and
 * an assertion function.
 */
class Contracts {
    /**
     * Tests the provided condition. If the condition is false an AssertionError is raised with an optional message.
     * If the provided condition is true, then the function returns without raising an error
     *
     * @param {boolean} condition - The condition to test
     * @param {string} message - A descriptive message to associate with the AssertionError
     * @param {Constructor<Error>} ErrorConstructor - The constructor of the Error to use
     * @throws {Error} - When the condition is false
     * @see AssertionError
     * @returns {boolean} - returns `true` if it does not throw
     * @throws {AssertionError} - Throws an AssertionError by default if the condition is false
     */
    assert: Assertion['assert'];
    /**
     * The `@ensures` decorator is an assertion of a postcondition.
     * It expresses a condition that must be true after the associated class member is executed.
     *
     * @param {PredicateType} predicate - The Assertion to test
     * @returns {MethodDecorator} - The method decorator
     * @throws {AssertionError} - Throws an AssertionError if the predicate is not a function
     */
    ensures: EnsuresDecorator['ensures'];
    /**
     * The `@invariant` decorator describes and enforces the properties of a class
     * via assertions. These assertions are checked after the associated class
     * is constructed, before and after every method execution, and before and after
     * every accessor usage (get/set).
     *
     * @param {PredicateType | Constructor<any>} fn - An optional assertion to apply to the class
     * @returns {ClassDecorator | Constructor<any>} - The decorated class, or the decorator if a predicate was provided
     * @throws {AssertionError} - Throws an Assertion error if not applied to a class.
     */
    invariant: InvariantDecorator['invariant'];
    /**
     * The 'override' decorator asserts that the current class feautre is a specialization or
     * replacement of an ancestor class's feature of the same name and argument count
     *
     * @param {object} target - The class
     * @param {PropertyKey} propertyKey - The property key
     * @param {PropertyDescriptor} descriptor - The property descriptor
     * @returns {PropertyDescriptor} - The PropertyDescriptor
     */
    override: OverrideDecorator['override'];
    /**
     * The `@demands` decorator is an assertion of a precondition.
     * It expresses a condition that must be true before the associated class member is executed.
     *
     * @param {PredicateType} predicate - The assertion
     * @returns {MethodDecorator} - The Method Decorator
     */
    demands: DemandsDecorator['demands'];
    /**
     * The `rescue` decorator enables a mechanism for providing Robustness.
     * It intercepts exceptions and provides a means to retry the
     * execution of the associated feature or to rethrow.
     *
     * @param {RescueType} fnRescue - The rescue function
     * @returns {MethodDecorator} - The MethodDecorator
     */
    rescue: RescueDecorator['rescue'];

    /**
     * Constructs a new instance of Contracts in the specified mode
     *
     * @param {boolean} checkMode - enables assertions
     */
    constructor(readonly checkMode: boolean) {
        this.assert = new Assertion(checkMode).assert;
        this.ensures = new EnsuresDecorator(checkMode).ensures;
        this.invariant = new InvariantDecorator(checkMode).invariant;
        this.override = new OverrideDecorator(checkMode).override;
        this.demands = new DemandsDecorator(checkMode).demands;
        this.rescue = new RescueDecorator(checkMode).rescue;
    }
}

export {Contracts,contracted};