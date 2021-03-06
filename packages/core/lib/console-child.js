const Command = require("../lib/command");
const TruffleError = require("@truffle/error");
const Config = require("@truffle/config");
const Web3 = require("web3");
const yargs = require("yargs");

const input = process.argv[2].split(" -- ");
const inputStrings = input[1];

//detect config so we can get the provider and resolver without having to serialize
//and deserialize them
const detectedConfig = Config.detect({network: yargs(input[0]).argv.network});
const customConfig = detectedConfig.networks.develop || {};

//need host and port for provider url
const ganacheOptions = {
  host: customConfig.host || "127.0.0.1",
  port: customConfig.port || 9545
};
const url = `http://${ganacheOptions.host}:${ganacheOptions.port}/`;

//set up the develop network to use, including setting up provider
detectedConfig.networks.develop = {
  host: customConfig.host || "127.0.0.1",
  port: customConfig.port || 9545,
  network_id: customConfig.network_id || 5777,
  provider: function () {
    return new Web3.providers.HttpProvider(url, {keepAlive: false});
  }
};

// enable Truffle to run both from the bundles out of packages/dist
// and using the raw JS directly - we inject BUNDLE_VERSION when building
const command =
  typeof BUNDLE_VERSION !== "undefined"
    ? new Command(require("./commands.bundled.js"))
    : new Command(require("./commands"));

command
  .run(inputStrings, detectedConfig)
  .then(() => process.exit(0))
  .catch(error => {
    // Perform error handling ourselves.
    if (error instanceof TruffleError) {
      console.log(error.message);
    } else {
      // Bubble up all other unexpected errors.
      console.log(error.stack || error.toString());
    }
    process.exit(1);
  });
