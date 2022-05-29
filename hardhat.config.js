module.exports = {
	solidity: {
		version: "0.8.0",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	paths: {
		root: "./tests",
		artifacts: "./contracts/.artifacts",
		cache: "./contracts/.cache",
	},
};
