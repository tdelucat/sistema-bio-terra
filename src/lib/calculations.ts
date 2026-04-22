export interface CalcParams {
  basePriceUsd: number;
  marginPercent: number;
  stateAdjustmentPercent: number;
  ptax: number;
  quantity: number;
  freightBrlTon?: number;
  isFob: boolean;
}

export function calculateQuote(params: CalcParams) {
  const { basePriceUsd, marginPercent, stateAdjustmentPercent, ptax, quantity, freightBrlTon = 0, isFob } = params;

  // 1. Price with margin
  // preco_com_margem = preco_base_usd / (1 - margem_percentual)
  const priceWithMargin = basePriceUsd / (1 - marginPercent);

  // 2. Price with state adjustment
  // preco_com_estado = preco_com_margem / (1 - adicional_percentual)
  const priceWithState = priceWithMargin / (1 - stateAdjustmentPercent);

  // 3. Product total in USD
  const productTotalUsd = priceWithState * quantity;

  // 4. Freight
  const freightTotalBrl = isFob ? 0 : (freightBrlTon * quantity);
  const freightTotalUsd = freightTotalBrl / ptax;

  // 5. Grand Totals
  const totalUsd = productTotalUsd + freightTotalUsd;
  const totalBrl = totalUsd * ptax;

  return {
    pricePerTonUsd: priceWithState,
    pricePerTonBrl: priceWithState * ptax,
    productTotalUsd,
    productTotalBrl: productTotalUsd * ptax,
    freightTotalUsd,
    freightTotalBrl,
    totalUsd,
    totalBrl
  };
}

export function derivePackagingPrices(price: number, sourcePackaging: string) {
  let granel = 0;
  let bb = 0;
  let sacaria = 0;

  if (sourcePackaging === 'Granel') {
    granel = price;
    bb = granel + 10;
    sacaria = bb + 5;
  } else if (sourcePackaging === 'Big Bag') {
    bb = price;
    granel = bb - 10;
    sacaria = bb + 5;
  } else if (sourcePackaging === 'Sacaria') {
    sacaria = price;
    bb = sacaria - 5;
    granel = bb - 10;
  }

  return { granel, bb, sacaria };
}
