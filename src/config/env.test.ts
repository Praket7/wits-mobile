import { validateConfig } from './env';

describe('validateConfig', () => {
  it('accepts an HTTPS API origin and public OIDC client settings', () => {
    expect(validateConfig({
      EXPO_PUBLIC_DATA_SOURCE: 'http',
      EXPO_PUBLIC_API_BASE_URL: 'https://api.sandbox.example',
      EXPO_PUBLIC_OIDC_ISSUER: 'https://login.example/tenant',
      EXPO_PUBLIC_OIDC_CLIENT_ID: 'public-mobile-client',
    }, false)).toEqual({ ok: true, problems: [] });
  });

  it('rejects a versioned API URL because /v1 is added by the client', () => {
    const result = validateConfig({
      EXPO_PUBLIC_DATA_SOURCE: 'http',
      EXPO_PUBLIC_API_BASE_URL: 'https://api.sandbox.example/v1',
      EXPO_PUBLIC_OIDC_ISSUER: 'https://login.example/tenant',
      EXPO_PUBLIC_OIDC_CLIENT_ID: 'public-mobile-client',
    }, false);
    expect(result.ok).toBe(false);
    expect(result.problems).toContain('EXPO_PUBLIC_API_BASE_URL must be the API origin only; the client adds the /v1 path prefix.');
  });

  it('rejects HTTP issuer URLs', () => {
    const result = validateConfig({
      EXPO_PUBLIC_DATA_SOURCE: 'http',
      EXPO_PUBLIC_API_BASE_URL: 'https://api.sandbox.example',
      EXPO_PUBLIC_OIDC_ISSUER: 'http://login.example',
      EXPO_PUBLIC_OIDC_CLIENT_ID: 'public-mobile-client',
    }, false);
    expect(result.problems).toContain('EXPO_PUBLIC_OIDC_ISSUER must be an HTTPS issuer URL without credentials, query parameters, or a fragment.');
  });

  it('requires the OpenID Connect scope', () => {
    const result = validateConfig({
      EXPO_PUBLIC_DATA_SOURCE: 'http',
      EXPO_PUBLIC_API_BASE_URL: 'https://api.sandbox.example',
      EXPO_PUBLIC_OIDC_ISSUER: 'https://login.example',
      EXPO_PUBLIC_OIDC_CLIENT_ID: 'public-mobile-client',
      EXPO_PUBLIC_OIDC_SCOPES: 'profile email',
    }, false);
    expect(result.problems).toContain('EXPO_PUBLIC_OIDC_SCOPES must include the required openid scope.');
  });
});
