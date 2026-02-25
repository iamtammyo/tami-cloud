import "dotenv/config";
import { GraphQLClient, gql } from "graphql-request";

const BUFFER_GRAPHQL_URL =
  process.env.BUFFER_GRAPHQL_URL || "https://graph.buffer.com";
const BUFFER_API_TOKEN = process.env.BUFFER_API_TOKEN;
const BUFFER_ORGANIZATION_ID = process.env.BUFFER_ORGANIZATION_ID;

if (!BUFFER_API_TOKEN) {
  console.error(
    "Error: BUFFER_API_TOKEN is required. Set it in your .env file."
  );
  process.exit(1);
}

if (!BUFFER_ORGANIZATION_ID) {
  console.error(
    "Error: BUFFER_ORGANIZATION_ID is required. Set it in your .env file."
  );
  process.exit(1);
}

const client = new GraphQLClient(BUFFER_GRAPHQL_URL, {
  headers: {
    Authorization: `Bearer ${BUFFER_API_TOKEN}`,
  },
});

const CREATE_IDEA = gql`
  mutation CreateIdea($input: CreateIdeaInput!) {
    createIdea(input: $input) {
      ... on Idea {
        id
        content {
          title
          text
        }
      }
    }
  }
`;

async function createIdea(title, text) {
  const variables = {
    input: {
      organizationId: BUFFER_ORGANIZATION_ID,
      content: {
        title,
        text,
      },
    },
  };

  try {
    const data = await client.request(CREATE_IDEA, variables);
    console.log("Idea created successfully:");
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Failed to create idea:", error.message);
    throw error;
  }
}

// Run with default values when executed directly
const title = process.argv[2] || "New Idea from GraphQL API";
const text =
  process.argv[3] ||
  "This is the text of the new idea created via the GraphQL API.";

createIdea(title, text);
