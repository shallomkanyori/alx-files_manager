# Files Manager
A simple API to upload and view files

## Routes

| Method | Path      | Description                                                      |
| ------ | --------- | ---------------------------------------------------------------- |
| `GET`  | `/status` | Returns if the Redis client and the MongoDB client are connected |

**Response (Status 200)**
```
{"redis":boolean,"db":boolean}
```


| Method | Path      | Description                                                            |
| ------ | --------- | ---------------------------------------------------------------------- |
| `GET`  | `/stats`  | Returns the number of documents in the `users` and `files` collections |

**Response (Status 200)**
```
{"users":number,"files":number}
```


| Method  | Path      | Description                 |
| ------- | --------- | --------------------------- |
| `POST`  | `/users`  | Adds a user to the database |

**Parameters**
| Parameter | Value      | Description | Parameter Type | Data Type |
|:---------:|:----------:|:-----------:|:--------------:|:---------:|
| email     | (required) | email       | body           | string    |
| password  | (required) | password    | body           | string    |

**Response (Status 201)**
```
{"id":string,"email":string}
```
