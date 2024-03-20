# Incourage Agent - `MVP1`

## Intro

This app keeps track of agent Gross Written Premiums and agent leader overwrites.


## Usage

**Requirements**

- nodejs (v18+)
- docker

```shell
# Assuming you have rights to access incourage/agent.mvp.git
git clone --recursive git@bitbucket.org:incourage/agent.mvp.git

cd agent.mvp

npm install

# Development
npm run db
npm run start
```

## API

**Versioning**

The API uses URI versioning; i.e. the version of the API being called will be specified as part of the URI as `/vX` from the base URL.

The documentation bellow applies to version 1(**/v1**) of the API.

Base URL: **http://agent.incourage.co.ke/v1/**


**Responses**

The API accepts and always returns `json` (*it is specified when it does not*) data with a `2xx` response code for successful calls, `4xx` or `5xx` for unsuccessful ones.

| Status Code | Description                                         |
| ----------- | --------------------------------------------------- |
| 200         | OK                                                  |
| 202         | OK; will be processed asynchronously                |
| 400         | Bad request; check if all required fields were sent |
| 404         | Duh!                                                |
| 401         | Unauthorized; check your Authorization header       |
| 403         | Forbidden; Boss, this is not for you!               |
| 429         | Too many requests; Boss, slow down!                 |
| 500         | Oops, we have problem!                              |

A typical response would look like:

```json
{
  "status": "2xx|4xx|5xx",
  "message": "String|[String]",
  "data": "Object|String|Array"
}
```


**Authentication**

Users are authenticated using [JSON Web Tokens](https://jwt.io/introduction/) (**JWT**) sent as `Bearer` in the `Authorization` field of every HTTP request made to the API.

```http
GET /v1/customers HTTP/1.1
Host: agent.incourage.co.ke
Accept: application/json
Authorization: Bearer [token]
```

The tokens are obtained when *signing in*  with the core backend service (quotations service)


### Models

- **Customer**

```json
{
    "id": 342,
    "address": "abc",
    "town": "Nairobi",
    "firstName": "Salim",
    "lastName": "Salama",
    "phoneNumber": "07xxxxxxx",
    "gender": "male",
    "postalAddress": "999",
    "occupation": "Teacher",
    "email": "some-email@some-host.zr",
    "kraPin": "123",
    "nationalId": "12312",
    "hudumaNumber": null,
    "kyc": {
        "nationalId": "url",
        "kraPin": "url",
    },
}
```

### Endpoints

- `GET /customers`: Get a list of all customers.
