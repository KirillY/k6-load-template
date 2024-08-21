# Description
K6 script with few scenarios, exit if smoke fail
# Usage
### Smoke PASSED
```shell
node server.js
k6 run -e SCENARIO=load script.js
```
### Smoke FAILED
```shell
node fail-smoke-server.js
k6 run -e SCENARIO=load script.js
```
