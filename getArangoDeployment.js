const ConfigMaker = require("./ConfigMaker");
console.log(JSON.stringify((new ConfigMaker({
  noAgents: 2,
  dockerImageName: "arangodb/arangodb:3.0.4",
  firstAgentPort: 5000
})).agencyDeployment, null, 2));
