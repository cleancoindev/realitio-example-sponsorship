var Sponsorship = artifacts.require("Sponsorship");

module.exports = function(deployer) {
  deployer.deploy(Sponsorship, "0xf0e80d44cd69c846c756a35d0534bcefc15fa388");
};
