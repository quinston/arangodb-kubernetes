# arangodb-kubernetes
A kubernetes configuration generator for deploying an ArangoDB cluster.

## What do I do?

1. ```npm i```
1. ```npm run agencyDeployment --silent | kubectl create -f -```
1. ```npm run agencyService --silent | kubectl create -f -```
1. ```npm run primaryDeployment --silent | kubectl create -f -```
1. ```npm run coordinatorDeployment --silent | kubectl create -f -```
1. ```npm run coordinatorService --silent | kubectl create -f -```
1. Connect to port `8529` of some coordinator. You should see your ArangoDB UI!

## What does this give me?

To run an ArangoDB cluster manually by passing
in command line parameters requires some
coordination:
* the hosts of all agents needs to be known to the agent that bootstraps the agency
* each primary must know the hosts of all agents
* each coordinator also must know of all agents

To hit the first point, the generated agency has all its agent containers
in a single pod, so that the hostname is always `localhost` and the port
numbers are under our control.
**Whatever node this pod ends up on is a single point of failure.
Be warned!** If your agency goes down and comes back up,
 you will have to force all your primaries and
coordinators to register themselves anew with
the agency (perhaps by restarting them).

To hit the second and third points, a service `arangodb-agency` is created that maps one port
to each agent container. Then the primaries and coordinators can simply
use `arangodb-agency` as a hostname for the agents.

## Things to know

### config.js
All configuration occurs in here. In particular:
* `firstAgentNodePort` is the port number assigned by `arangodb-agency` to
the first agent. The next agent is assigned `firstAgentNodePort` plus one,
the next plus two and so on.
* `firstAgentInternalPort` is the port number assigned by the `arangodb-agency`
pod to the first agent's container. Successive agents are enumerated with
successive port numbers.

## Incomplete list of stuff that is missing
* Besides taking down coordinators and primaries and watching them come
back to life, I haven't actually tested any of the more sophisticated
features such as automatic fallover, replication, ...
* The primary configuration comes with no volume mounts. You might have
to change that if you want your data to persist across crashes.
