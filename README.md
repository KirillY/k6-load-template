# Description
K6 script with few scenarios, exit if smoke fail
# Usage
### Smoke PASSED
```shell
k6 run -e SCENARIO=load script.js
```
### Smoke FAILED
```shell
k6 run -e SCENARIO=load fail-smoke-server.js
```
