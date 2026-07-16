export default () => ({
  env: process.env.NODE_ENV || 'development',

  server: {
    port: parseInt(process.env.PORT || '3000'),
    apiPrefix: '/api/v1',
  },

  database: {
    type: 'postgres',
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432'),
    username: process.env.DB_USERNAME || process.env.DATABASE_USER || 'staging_user',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'staging_password_change_me',
    name: process.env.DB_NAME || process.env.DATABASE_NAME || 'disha_staging_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.LOG_LEVEL === 'debug',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '900s',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '604800s',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'disha-documents-dev',
    },
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
  },
});

