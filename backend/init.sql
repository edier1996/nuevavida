-- Create databases for each microservice
CREATE DATABASE IF NOT EXISTS userdb;
CREATE DATABASE IF NOT EXISTS productdb;
CREATE DATABASE IF NOT EXISTS cartdb;
CREATE DATABASE IF NOT EXISTS orderdb;
CREATE DATABASE IF NOT EXISTS paymentdb;
CREATE DATABASE IF NOT EXISTS defaultdb;

-- Grant privileges
GRANT ALL PRIVILEGES ON userdb.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON productdb.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON cartdb.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON orderdb.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON paymentdb.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON defaultdb.* TO 'root'@'%';

FLUSH PRIVILEGES;
