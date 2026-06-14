/**
 * @input a valibot schema for a profile's env file plus resolution config
 * @output a profile loader: resolve name + env -> read & validate <root>/<name>/<env>/<file>
 * @pos profile-first config boundary, generalized from per-product env loaders
 * @protocol Update header on change, then check AGENTS.md
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { parse as parseDotenv } from "dotenv";
import { type GenericSchema, type InferOutput, parse as parseSchema } from "valibot";

import { cliError } from "./errors";

const profileNamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export type LoadedProfile<TValues> = {
  name: string;
  env: string;
  root: string;
  path: string;
  values: TValues;
};

export type ProfileConfig<TSchema extends GenericSchema> = {
  /** valibot schema the env file is validated against. */
  schema: TSchema;
  /** Logical app name; also the default `~/.config/<app>` dir and the env-var prefix. */
  app: string;
  /** Env file name inside `<root>/<name>/<env>/`, e.g. "mycli.env". */
  fileName: string;
  /** Allowed env names (e.g. ["dev", "prod"]). Omit to allow any non-empty value. */
  envs?: readonly string[];
  /** Config root override; defaults to `$<APP>_CONFIG_ROOT` or `~/.config/<app>`. */
  configRoot?: string;
};

export type ProfileLoader<TValues> = {
  resolveName: (profile?: string) => string;
  resolveEnv: (env?: string) => string;
  resolvePath: (input: { name: string; env: string }) => string;
  load: (input?: { profile?: string; env?: string }) => LoadedProfile<TValues>;
};

export function defineProfile<TSchema extends GenericSchema>(
  config: ProfileConfig<TSchema>,
): ProfileLoader<InferOutput<TSchema>> {
  const prefix = config.app.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const profileVar = `${prefix}_PROFILE`;
  const envVar = `${prefix}_ENV`;
  const rootVar = `${prefix}_CONFIG_ROOT`;

  function configRoot() {
    return config.configRoot ?? process.env[rootVar] ?? resolve(homedir(), ".config", config.app);
  }

  function validateName(name: string) {
    if (profileNamePattern.test(name) && name !== "." && name !== "..") {
      return name;
    }
    throw cliError({
      code: "missing_profile",
      message: `Invalid ${config.app} profile name: ${name}`,
      hint: "Use a relative profile slug like my-profile.",
    });
  }

  function resolveName(profile?: string) {
    const name = profile ?? process.env[profileVar];
    if (!name) {
      throw cliError({
        code: "missing_profile",
        message: `Missing ${config.app} profile`,
        hint: `Pass --profile <name> or set ${profileVar}.`,
      });
    }
    return validateName(name);
  }

  function resolveEnv(env?: string) {
    const value = env ?? process.env[envVar];
    if (!value) {
      throw cliError({
        code: "missing_profile",
        message: `Missing ${config.app} target env`,
        hint: `Pass --env <name> or set ${envVar}.`,
      });
    }
    if (config.envs && !config.envs.includes(value)) {
      throw cliError({
        code: "invalid_input",
        message: `Unknown ${config.app} env: ${value}`,
        hint: `Use one of: ${config.envs.join(", ")}.`,
      });
    }
    return value;
  }

  function resolvePath(input: { name: string; env: string }) {
    return resolve(configRoot(), validateName(input.name), input.env, config.fileName);
  }

  function load(input: { profile?: string; env?: string } = {}) {
    const name = resolveName(input.profile);
    const env = resolveEnv(input.env);
    const root = resolve(configRoot(), name);
    const path = resolvePath({ name, env });

    if (!existsSync(path)) {
      throw cliError({
        code: "missing_profile",
        message: `Missing ${config.app} profile surface: ${path}`,
        hint: `Create ${path}.`,
      });
    }

    const values = parseSchema(config.schema, parseDotenv(readFileSync(path)));
    return { name, env, root, path, values };
  }

  return { resolveName, resolveEnv, resolvePath, load };
}
