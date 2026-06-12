const url = process.env.APP_URL || "http://localhost:3000";

const response = await fetch(`${url.replace(/\/$/, "")}/api/health`);
if (!response.ok) {
  const body = await response.text();
  console.error(body);
  process.exit(1);
}

console.log(await response.text());

