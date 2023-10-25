## Endpoints

### `GET`

- `GET` /last_reported
- `GET` /unmanaged
- `GET` /app_list/:catalogId
- `GET` /devices
- `GET` /device-details/:id

### `POST`

- `POST` /update_app_list/:catalogId
- `POST` /add_app/:catalogId/:id"
- `POST` /send-message -> (ids,message)
- `POST` /change-owner -> (user,ids)
- `POST` /change-name -> (id,name)
- `POST` /remove-devices -> ids
- `POST` /install-apps -> (ids,apps)
- `POST` /remove_app/:catalogId/:id