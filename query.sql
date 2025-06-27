CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, username, email, password_hash) VALUES ("user-1", 'john_doe', 'john@example.com', 'hashed_password_here');

-- Device table
CREATE TABLE device (
  id VARCHAR(128) PRIMARY KEY,
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  status VARCHAR(50) NOT NULL,
  threshold_hum FLOAT,
  threshold_temp FLOAT,
  mqtt_topic VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Data table
CREATE TABLE device_data (
  id VARCHAR(128) PRIMARY KEY,
  device_id VARCHAR(128) NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  data_hum FLOAT,
  data_temp FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

 UPDATE users SET id='cyrus-akhemeniyah-the-great', updated_at=CURRENT_TIMESTAMP WHERE id='30b441ab-ddaf-489f-873d-4efd6dc7dede'

INSERT INTO device_new (id, longitude, latitude, status, hum_max, temp_max, mqtt_topic, created_at, updated_at, hum_min, temp_min)
SELECT id, longitude, latitude, status, hum_max, temp_max, mqtt_topic, created_at, updated_at, hum_min, temp_min
FROM device;