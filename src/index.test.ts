/**
 * @license
 * Copyright (C) #{YEAR}# Michael L Haufe
 * SPDX-License-Identifier: AGPL-1.0-only
 *
 * Unit tests for the Contructor class
 */
import Contracts from './';

/**
 * Requirement 194
 * https://dev.azure.com/thenewobjective/decorator-contracts/_workitems/edit/194
 */
describe('', () => {
    test('Construction', () => {
        expect(new Contracts(true).debugMode).toBe(true);
        expect(new Contracts(false).debugMode).toBe(false);
    });
});