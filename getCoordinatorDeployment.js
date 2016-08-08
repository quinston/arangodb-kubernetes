const ConfigMaker = require("./ConfigMaker");
const config = require('./config');
console.log(JSON.stringify((new ConfigMaker(config)).coordinatorDeployment, null, 2));
