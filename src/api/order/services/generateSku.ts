export async function createSku(maxAttempts = 10): Promise<string | null> {
  if (maxAttempts === 0) {
    return null;
  }
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code: string = "";

  for (let i = 0; i < 3; i++) {
    let number = Math.floor(Math.random() * 26) + 1;
    code += characters.charAt(number);
  }

  const existingSku = await strapi.entityService.findMany(
    "api::order-item.order-item",
    {
      filters: { sku: code },
    }
  );

  if(Object.keys(existingSku).length > 0){
    return createSku(maxAttempts - 1);
  }
  return code;
}
