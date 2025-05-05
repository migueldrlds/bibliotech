module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', ['clave1', 'clave2', 'clave3', 'clave4']),
  },
  // resto de configuración...
});
