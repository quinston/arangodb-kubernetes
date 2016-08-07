const check = require('check-types');

const rangeFromZeroToXMinusOne = x => [...Array(x).keys()];

module.exports = class ConfigMaker {
  /*
  Agents' ports are numbered consecutively starting at firstAgentInternalPort

  Externally they are numbered consecutively from firstAgentNodePort
  */
  constructor({ noAgents, dockerImageName, firstAgentInternalPort, firstAgentNodePort }) {
    check.assert.positive(noAgents);
    check.assert.integer(noAgents);
    check.assert.nonEmptyString(dockerImageName);
    check.assert.positive(firstAgentInternalPort);
    check.assert.integer(firstAgentInternalPort);
    check.assert.positive(firstAgentNodePort);
    check.assert.integer(firstAgentNodePort);

    this.noAgents = noAgents;
    this.dockerImageName = dockerImageName;
    this.firstAgentInternalPort = firstAgentInternalPort;
    this.firstAgentNodePort = firstAgentNodePort;
  }


  makeAgentContainer({ name, agentId }) {
    check.assert.nonEmptyString(name);
    check.assert.integer(agentId);
    check.assert.greaterOrEqual(agentId, 0);
    check.assert.less(agentId, this.noAgents);

    return {
      name,
      image: this.dockerImageName,
      env: [
        {
          name: 'ARANGO_RANDOM_ROOT_PASSWORD',
          value: '1'
        }
      ],
      args:
        `--server.endpoint tcp://0.0.0.0:${this.firstAgentInternalPort + agentId}
        --server.authentication false
        --agency.id ${agentId}
        --agency.size ${this.noAgents}
        --agency.supervision true
        ${
          /* The below creates something like
          --agency.endpoint tcp://localhost:5000
          --agency.endpoint tcp://localhost:5001
          --agency.endpoint tcp://localhost:5002
          ...
          --agency.endpoint tcp://localhost:5003

          where the list exhausts the addresses of all agents
          and is in order of agent ID
          */
          (rangeFromZeroToXMinusOne(this.noAgents)
          .map(i => `--agency.endpoint tcp://localhost:${this.firstAgentInternalPort + i}`))
          .join(' ')
        }
        --agency.notify true`
        .split(/\s+/)
    };
  }

  get agencyDeployment() {
    return {
      apiVersion: 'extensions/v1beta1',
      kind: 'Deployment',
      metadata: {
        name: 'arangodb-agency'
      },
      spec: {
        replicas: 1,
        template: {
          metadata: {
            labels: {
              app: 'arangodb-agency'
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

  get agencyService() {
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: 'arangodb-agency'
      },
      spec: {
        type: 'NodePort',
        selector: {
          app: 'arangodb-agency'
        },
        ports: rangeFromZeroToXMinusOne(this.noAgents)
        .map(i => ({
          protocol: 'TCP',
          targetPort: this.firstAgentInternalPort + i,
          port: this.firstAgentNodePort + i
        }))
      }
    };
  }
};
