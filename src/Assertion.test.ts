/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

import AssertionError from './AssertionError';
import {Contracts} from './';

/**
 * Requirement 69
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/69
 */
describe('Assertions must support a means of enabling/disabling', () => {
    test('false assertions', () => {
        const {assert: assertDebug} = new Contracts(true),
            {assert: assertProd} = new Contracts(false);

        expect(() => assertDebug(false)).toThrow(AssertionError);
        expect(() => assertProd(false)).not.toThrow();
    });
});

/**
 * Requirement 71
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/71
 */
describe('Assertions must support throwing custom error types', () => {
    const assert: Contracts['assert'] = new Contracts(true).assert,
        fn = (): void => assert(false, 'BOOM!');

    expect(fn).toThrow(AssertionError);
    expect(fn).toThrowError('BOOM!');
});
