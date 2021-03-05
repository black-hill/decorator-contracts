/*!
 * @license
 * Copyright (C) 2021 Final Hill LLC
 * SPDX-License-Identifier: AGPL-3.0-only
 * @see <https://spdx.org/licenses/AGPL-3.0-only.html>
 */

 /**
 * Constructs a type representing a constructor
 */
type Constructor<T> = new(...args: any[]) => T;