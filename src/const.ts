/**
 * kv3 header regexp pattern.
 *
 * @see {@link https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/KeyValues3#Text_Header}
 */
export const HEADER_REGEX = /^(\s*|)(?<header><!--\s+kv3.+-->)\s*\n/;

/**
 * Permitted flags prefixing string values.
 *
 * @see {@link https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/KeyValues3#Flags}.
 */
export enum StringFlag {
  Resource = "resource",
  DeferredResource = "deferred_resource",
}

/** Keyword values. */
export enum Keyword {
  True = "true",
  False = "false",
}
