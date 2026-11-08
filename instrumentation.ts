// Läuft einmal beim Start des Servers, bevor er Anfragen annimmt
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { legeSchemaAn } = await import("./lib/schema");
    await legeSchemaAn();
  }
}
