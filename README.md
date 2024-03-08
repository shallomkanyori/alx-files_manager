# Files Manager
A simple API to upload and view files

| --- | --- | --- |
| `GET` | `/status` | Returns if the Redis client and the MongoDB client are connected |
Response (Status 200)
```
{"redis":true,"db":true}
```

| --- | --- | --- |
| `GET` | `/stats` | Returns the number of documents in the `users` and `files` collections |
Response (Status 200)
```
{"users":2,"files":14}
```
