import { ApolloServer, gql } from "apollo-server";

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
