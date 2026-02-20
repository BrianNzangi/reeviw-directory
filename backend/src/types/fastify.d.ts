import "fastify";

declare module "fastify" {
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
