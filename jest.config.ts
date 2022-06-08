import type { Config } from "@jest/types";

export default {
	verbose: true,
	preset: "ts-jest",
	testEnvironment: "node",
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
} as Config.InitialOptions;
