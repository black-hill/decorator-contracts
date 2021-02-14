/*!
 * @license
 * Copyright (C) 2020 Final Hill LLC
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

export const ASSERTION_FAILED = 'Assertion failure';
export const MSG_INVALID_ARG_LENGTH = 'An overridden method must have the same number of parameters as its ancestor method';
export const MSG_NO_STATIC = 'Only instance members can be decorated, not static members';
export const MSG_NO_MATCHING_FEATURE = 'This feature does not override an ancestor feature.';
export const MSG_DUPLICATE_OVERRIDE = 'Only a single @override decorator can be assigned to a class member';
export const MSG_DUPLICATE_RESCUE = 'Only a single @rescue can be assigned to a feature';
export const MSG_NO_PROPERTY_RESCUE = 'A property can not be assigned a @rescue';
export const MSG_NOT_CONTRACTED = 'The current class or one of its ancestors must extend Contracted(...)';