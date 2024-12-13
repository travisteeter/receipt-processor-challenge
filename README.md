# Receipt Processor Challenge
_This doc was last updated 12/13/2024_

## Description:
This repository hosts a backend solution to the fetch rewards ['receipt-processor-challenge'](https://github.com/fetch-rewards/receipt-processor-challenge) - basic functionality for processing a given receipt & retrieving points of a given receipt id.

Refer to original repository for [documentation](https://github.com/fetch-rewards/receipt-processor-challenge/blob/main/README.md) and [API spec](https://github.com/fetch-rewards/receipt-processor-challenge/blob/main/api.yml).

### Development stack:

* Node.js
* Express

## Prerequisites:

Make sure the following tools are installed on system hosting the application:
* Docker ([latest version](https://docs.docker.com/get-started/get-docker/))
* Postman (for testing; [latest version](https://www.postman.com/downloads/))

## Deployment:

To deploy the application, follow these steps:
1. Clone git repository to local system
```
git clone https://github.com/travisteeter/receipt-processor-challenge.git
```
2. From cloned repository's directory, enter CLI command to build docker image
```
docker build -t [image name, e.g. receipt-processor] .
```
3. Run the built image in a docker container
```
docker run -it -p -d 3000:3000 [image name]
```
4. Confirming docker container is running & monitor status
```
docker ps -a                                     # displays status & container id
docker container logs [container id] --follow    # read/follow console.log of container
```

## Testing:

To perform simple test-cases, see [examples](https://github.com/fetch-rewards/receipt-processor-challenge/blob/main/README.md) in original repository & follow these steps:
1. Open Postman
2. To test `POST` request `/receipts/process`:

<br />
   
  - Select `POST` method & paste `http://localhost:3000/receipts/process` in URL textbox
  - Confirm minimal `Headers` are set accordingly:
    ```
    Content-Type:    application/json
    Content-Length:  <calculated when request is sent>
    Host:            <calculated when request is sent>
    Postman-Token:   <calculated when request is sent>
    ```

  - Set `Body` as `raw` with `JSON` format, then paste JSON request body for testing (see [examples](https://github.com/fetch-rewards/receipt-processor-challenge/blob/main/README.md))
  - Press `Send` and confirm API response in bottom panel

<br />

3. To test `GET` request `/receipts/{id}/points`:

<br />

  - Select `GET` method and paste `http://localhost:3000/receipts/{id}/points` in the URL textbox (replace `{id}` with the ID returned by `/receipts/process`).
  
  - Confirm minimal `Headers` are set accordingly:

    ```
    Host:            <calculated when request is sent>
    Postman-Token:   <calculated when request is sent>
    ```
  - Press `Send` and validate the API response in the bottom panel
    
