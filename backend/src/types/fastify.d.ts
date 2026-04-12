import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    cache: {
      enabled: boolean;
      getJson: <T>(key: string) => Promise<T | null>;
      setJson: <T>(key: string, value: T, ttlSeconds: number) => Promise<void>;
      getVersion: (name: string) => Promise<number>;
      getVersions: (names: string[]) => Promise<Record<string, number>>;
      bumpVersion: (name: string) => Promise<number>;
      buildKey: (prefix: string, parts?: Record<string, string | number | boolean | null | undefined>) => string;
    };
  }

  interface FastifyRequest {
    session?: {
      user: {
        id: string;
        email: string;
      };
    };
    authUser?: {
      id: string;
      email: string;
      roleId: string;
      isActive: boolean;
    };
    access?: {
      userId: string;
      email: string;
      roleName: string;
      permissions: string[];
    };
  }
}
