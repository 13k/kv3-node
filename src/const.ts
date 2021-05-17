/**
 * Default kv3 encoding GUID.
 */
export const DEFAULT_ENCODING_GUID = "e21c7f3c-8a33-41c5-9977-a76d3a32aa0d";

/**
 * Default kv3 version GUID.
 */
export const DEFAULT_VERSION_GUID = "7412167c-06e9-4698-aff2-e63eb59037e7";

/**
 * Default kv3 header.
 */
export const DEFAULT_HEADER = `<!-- kv3 encoding:text:version{${DEFAULT_ENCODING_GUID}} format:generic:version{${DEFAULT_VERSION_GUID}} -->`;

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
