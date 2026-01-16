import {
  SSMClient,
  GetParametersByPathCommand,
} from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: "ap-south-1" });

export async function loadFromSSM() {
  let nextToken;
  const params = {};

  do {
    const command = new GetParametersByPathCommand({
      Path: "/coldr/prod/",
      WithDecryption: true,
      Recursive: true,
      NextToken: nextToken,
    });

    const response = await ssm.send(command);

    response.Parameters.forEach((param) => {
      const key = param.Name.split("/").pop();
      params[key] = param.Value;
    });

    nextToken = response.NextToken;
  } while (nextToken);

  // Inject into process.env
  Object.entries(params).forEach(([key, value]) => {
    process.env[key] = value;
  });
}
