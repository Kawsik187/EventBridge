import jwt from 'jsonwebtoken';

/**
 * Retrieves the JWT Secret securely.
 * Throws a fatal configuration error in production if JWT_SECRET is unset or insecure.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret || secret.trim() === '' || secret === 'change_this_secret_in_production' || secret === 'eventbridge_secret') {
    if (isProduction) {
      throw new Error('FATAL SECURITY ERROR: In production, process.env.JWT_SECRET must be explicitly configured with a strong, private secret key!');
    }
  }

  return secret || 'eventbridge_dev_internal_secret_do_not_use_in_prod';
};

export const signToken = (id, expiresIn = '30d') => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
