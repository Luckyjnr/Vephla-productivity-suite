const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver } = require('graphql');

/**
 * Custom directive to require authentication
 */
function requireAuthDirective(directiveName = 'requireAuth') {
  return {
    requireAuthDirectiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,
    requireAuthDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const requireAuthDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
          
          if (requireAuthDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;
            
            fieldConfig.resolve = async function (...args) {
              const [, , context] = args;
              
              if (!context.user) {
                throw new AuthenticationError('You must be logged in to access this field');
              }
              
              return resolve.apply(this, args);
            };
          }
          
          return fieldConfig;
        },
      }),
  };
}

/**
 * Custom directive to require specific role
 */
function requireRoleDirective(directiveName = 'requireRole') {
  return {
    requireRoleDirectiveTypeDefs: `directive @${directiveName}(role: String!) on FIELD_DEFINITION`,
    requireRoleDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const requireRoleDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
          
          if (requireRoleDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;
            const requiredRole = requireRoleDirective.role;
            
            fieldConfig.resolve = async function (...args) {
              const [, , context] = args;
              
              if (!context.user) {
                throw new AuthenticationError('You must be logged in to access this field');
              }
              
              if (context.user.role !== requiredRole) {
                throw new ForbiddenError(`You must have ${requiredRole} role to access this field`);
              }
              
              return resolve.apply(this, args);
            };
          }
          
          return fieldConfig;
        },
      }),
  };
}

module.exports = {
  requireAuthDirective,
  requireRoleDirective
};