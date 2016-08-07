const check = require('check-types');

const rangeFromZeroToXMinusOne = x => [...Array(x).keys()];

module.exports = class ConfigMaker {
  /*
  Agents' ports are numbered consecuively starting at firstAgentPort
  */
  constructor({ noAgents, dockerImageName, firstAgentPort }) {
    check.assert.positive(noAgents);
    check.assert.integer(noAgents);
    check.assert.nonEmptyString(dockerImageName);
    check.assert.positive(firstAgentPort);
    check.assert.integer(firstAgentPort);

    this.noAgents = noAgents;
    this.dockerImageName = dockerImageName;
    this.firstAgentPort = firstAgentPort;
  }


  makeAgentContainer({ name, agentId }) {
    check.assert.nonEmptyString(name);
    check.assert.integer(agentId);
    check.assert.greaterOrEqual(agentId, 0);
    check.assert.less(agentId, this.noAgents);

    return {
      name,
      image: this.dockerImageName,
      args: [
        `--server.endpoint tcp://0.0.0.0:${this.firstAgentPort + agentId}`,
        '--server.authentication false',
        `--agency.id ${agentId}`,
        `--agency.size ${this.noAgents}`,
        '--agency.supervision true',
        /* The below creates something like
        --agency.endpoint tcp://localhost:5000
        --agency.endpoint tcp://localhost:5001
        --agency.endpoint tcp://localhost:5002
        ...
        --agency.endpoint tcp://localhost:5003

        where the list exhausts the addresses of all agents
        and is in order of agent ID
        */
        ...(rangeFromZeroToXMinusOne(this.noAgents)
        .map(i => `--agency.endpoint tcp://localhost:${this.firstAgentPort + i}`)),
        '--agency.notify true'
      ]
    };
  }

  get agencyDeployment() {
    return {
      apiVersion: 'extensions/v1beta1',
      kind: 'Deployment',
      metadata: {
        name: 'arango-agency'
      },
      spec: {
        replicas: this.noAgents,
        template: {
          metadata: {
            labels: {
              app: 'arango-agency'
            }
          },
          spec: {
            containers: rangeFromZeroToXMinusOne(this.noAgents)
            .map(i => this.makeAgentContainer({
              name: `arangodb-agent${i}`,
              agentId: i
            }))
          }
        }
      }
    }
  }
};
