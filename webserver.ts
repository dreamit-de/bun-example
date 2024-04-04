import { GraphQLServer, JsonLogger } from "@dreamit/graphql-server";
import type { Logger } from "@dreamit/graphql-server-base";
import { userSchema, userSchemaResolvers } from "./ExampleSchemas";
import type { Server } from "bun";

export function createAndStartWebserver(
  logger: Logger = new JsonLogger('bun-server', 'user-service')
  ): Server {

  const graphqlServer = new GraphQLServer(
    {
        schema: userSchema,
        rootValue: userSchemaResolvers,
        logger: logger
    }
  )
  
  const server = Bun.serve({
      port: 3000,
      async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/metrics") {
          const metricsResponse = await graphqlServer.getMetrics()
          return new Response(metricsResponse, {headers: 
           {
            'content-type':  graphqlServer.getMetricsContentType() 
           }
          });
        } else if (url.pathname === "/graphql") {
          let jsonBody = undefined
        try {
          jsonBody = await req.json()
        } catch (error) {
          logger.error('Cannot read body as json', error as Error)
        }
  
        const result = await graphqlServer.handleRequest({
          //TODO: Check how req.headers can be used 
          headers: {'content-type': 'application/json'},
          url: req.url,
          body: jsonBody,
          method: req.method,
        })         
        return new Response(JSON.stringify(result.executionResult));
        }
        return new Response(undefined, {status: 404});
      },
    });
    
  logger.info(`Listening on http://localhost:${server.port} ...`);
  return server
}
