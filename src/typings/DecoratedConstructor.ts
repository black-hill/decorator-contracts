/*!
 * @license
 * Copyright (C) 2020 Michael L Haufe
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

// TODO: Deprecate in favor of CLASS_REGISTRY directly

import type {Constructor} from './Constructor';
// TODO: move symbols
export const IS_PROXY = Symbol('Is Proxy');
export const INNER_CLASS = Symbol('Inner Class');

export type DecoratedConstructor = Constructor<any> & {
    [IS_PROXY]?: boolean;
    [INNER_CLASS]?: Constructor<any>;
};