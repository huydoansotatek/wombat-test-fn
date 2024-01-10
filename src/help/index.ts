import BigNumber from "bignumber.js";

export const WAD_SOLANA = BigNumber(100000000);
export const WAD_STELLAR = BigNumber(10000000);
export const WAD_EVM = BigNumber("1000000000000000000");

export const DECIMALS_SOLANA = BigNumber(8);
export const DECIMALS_STELLAR = BigNumber(7);
export const DECIMALS_EVM = BigNumber(18);

export const ampFactor_solana = BigNumber(12500);
export const haircutRate_solana = BigNumber(0);

export const ampFactor_stellar = BigNumber(12500);
export const haircutRate_stellar = BigNumber(1000);

export const ampFactor_evm = BigNumber(12500);
export const haircutRate_evm = BigNumber(1000);
export enum TYPE_NETWORK {
  SOLANA,
  STELLAR,
  EVM,
}

export type AssetData = {
  cash: BigNumber;
  liability: BigNumber;
  underlyingDecimals: BigNumber;
};

//rounds to zero if x*y < WAD / 2
export function wdiv(
  network: TYPE_NETWORK,
  x: BigNumber,
  y: BigNumber
): BigNumber {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
      ? WAD_STELLAR
      : WAD_EVM;
  return x
    .times(WAD)
    .plus(y.div(2).integerValue(BigNumber.ROUND_FLOOR))
    .div(y)
    .integerValue(BigNumber.ROUND_FLOOR);
}

//rounds to zero if x*y < WAD / 2
export function wmul(
  network: TYPE_NETWORK,
  x: BigNumber,
  y: BigNumber
): BigNumber {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
      ? WAD_STELLAR
      : WAD_EVM;

  return x
    .times(y)
    .plus(WAD.div(2).integerValue(BigNumber.ROUND_FLOOR))
    .div(WAD)
    .integerValue(BigNumber.ROUND_FLOOR);
}

// Convert x from WAD (18 decimals) to d decimals.
export function fromWad(
  network: TYPE_NETWORK,
  x: BigNumber,
  d: BigNumber
): BigNumber {
  const DECIMALS =
    network == TYPE_NETWORK.SOLANA
      ? DECIMALS_SOLANA
      : network == TYPE_NETWORK.STELLAR
      ? DECIMALS_STELLAR
      : DECIMALS_EVM;
  if (d.lt(DECIMALS)) {
    return x
      .div(BigNumber(10).pow(DECIMALS.minus(d)))
      .integerValue(BigNumber.ROUND_FLOOR);
  } else if (d.gt(DECIMALS)) {
    return x.times(BigNumber(10).pow(d.minus(DECIMALS)));
  }
  return x;
}

// Convert x to WAD (18 decimals) from d decimals.
// convert current token number to asset token number
export function toWad(
  network: TYPE_NETWORK,
  x: BigNumber,
  d: BigNumber
): BigNumber {
  const DECIMALS =
    network == TYPE_NETWORK.SOLANA
      ? DECIMALS_SOLANA
      : network == TYPE_NETWORK.STELLAR
      ? DECIMALS_STELLAR
      : DECIMALS_EVM;

  if (d.lt(DECIMALS)) {
    return x.times(BigNumber(10).pow(DECIMALS.minus(d)));
  } else if (d.gt(DECIMALS)) {
    return x
      .div(BigNumber(10).pow(d.minus(DECIMALS)))
      .integerValue(BigNumber.ROUND_FLOOR);
  }
  return x;
}

// Babylonian Method with initial guess (typecast as int)
//internal pure returns (int256 z)
export function sqrt(y: BigNumber, guess: BigNumber): BigNumber {
  let z: BigNumber = BigNumber(0);
  if (y.gt(BigNumber(3))) {
    if (guess.gt(BigNumber(0)) && guess.lte(y)) {
      z = guess;
    } else if (guess.lt(BigNumber(0)) && BigNumber(0).minus(guess).lte(y)) {
      z = BigNumber(0).minus(guess);
    } else {
      z = y;
    }
    let x = y
      .div(z)
      .integerValue(BigNumber.ROUND_FLOOR)
      .plus(z)
      .div(BigNumber(2))
      .integerValue(BigNumber.ROUND_FLOOR);
    while (!x.isEqualTo(z)) {
      z = x;
      x = y
        .div(x)
        .integerValue(BigNumber.ROUND_FLOOR)
        .plus(x)
        .div(BigNumber(2))
        .integerValue(BigNumber.ROUND_FLOOR);
    }
  } else if (!y.isEqualTo(BigNumber(0))) {
    z = BigNumber(1);
  }
  return z;
}

export function quoteSwap(
  network: TYPE_NETWORK,
  fromAsset: AssetData,
  toAsset: AssetData,
  fromAmount: BigNumber,
  ampFactor: BigNumber,
  scaleFactor: BigNumber,
  haircutRate: BigNumber
): [BigNumber, BigNumber] {
  let haircut = BigNumber(0);
  let actualToAmount = BigNumber(0);
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
      ? WAD_STELLAR
      : WAD_EVM;
  if (fromAmount.lt(BigNumber(0))) {
    fromAmount = wdiv(network, fromAmount, WAD.minus(haircutRate));
  }

  let fromCash = fromAsset.cash;
  let fromLiability = fromAsset.liability;

  let toCash = toAsset.cash;
  let toLiability = toAsset.liability;

  if (!scaleFactor.isEqualTo(WAD)) {
    // apply scale factor on from-amounts
    fromCash = fromCash
      .times(scaleFactor)
      .div(WAD)
      .integerValue(BigNumber.ROUND_FLOOR);
    fromLiability = fromLiability
      .times(scaleFactor)
      .div(WAD)
      .integerValue(BigNumber.ROUND_FLOOR);
    fromAmount = fromAmount
      .times(scaleFactor)
      .div(WAD)
      .integerValue(BigNumber.ROUND_FLOOR);
  }

  const idealToAmount = swapQuoteFunc(
    network,
    fromCash,
    toCash,
    fromLiability,
    toLiability,
    fromAmount,
    ampFactor
  );

  if (
    (fromAmount.gt(BigNumber(0)) && toCash.lt(idealToAmount)) ||
    (fromAmount.lt(BigNumber(0)) && fromCash.lt(BigNumber(0).minus(fromAmount)))
  ) {
    throw new Error("CORE_CASH_NOT_ENOUGH();");
  }

  if (fromAmount.gt(BigNumber(0))) {
    // normal quote
    haircut = wmul(network, idealToAmount, haircutRate);
    actualToAmount = idealToAmount.minus(haircut);
  } else {
    // exact output swap quote count haircut in the fromAmount
    actualToAmount = idealToAmount;
    haircut = wmul(network, BigNumber(0).minus(fromAmount), haircutRate);
  }

  return [actualToAmount, haircut];
}

function swapQuoteFunc(
  network: TYPE_NETWORK,
  Ax: BigNumber,
  Ay: BigNumber,
  Lx: BigNumber,
  Ly: BigNumber,
  Dx: BigNumber,
  A: BigNumber
) {
  if (Lx.isEqualTo(BigNumber(0)) || Ly.isEqualTo(BigNumber(0))) {
    // in case div of 0
    throw new Error("CORE_UNDERFLOW()");
  }

  const D = Ax.plus(Ay).minus(
    wmul(
      network,
      A,
      Lx.times(Lx)
        .div(Ax)
        .integerValue(BigNumber.ROUND_FLOOR)
        .plus(Ly.times(Ly).div(Ay).integerValue(BigNumber.ROUND_FLOOR))
    )
  );
  const rx_ = wdiv(network, Ax.plus(Dx), Lx);
  const b = Lx.times(rx_.minus(wdiv(network, A, rx_)))
    .div(Ly)
    .integerValue(BigNumber.ROUND_FLOOR)
    .minus(wdiv(network, D, Ly)); // flattened _coefficientFunc
  const ry_ = _solveQuad(network, b, A);
  const Dy = wmul(network, Ly, ry_).minus(Ay);
  return Dy.abs();
}

/**
 * @notice Solve quadratic equation
 * @dev This function always returns >= 0
 * @param b quadratic equation b coefficient
 * @param c quadratic equation c coefficient
 * @return x
 */
function _solveQuad(
  network: TYPE_NETWORK,
  b: BigNumber,
  c: BigNumber
): BigNumber {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
      ? WAD_STELLAR
      : WAD_EVM;

  return sqrt(b.times(b).plus(c.times(BigNumber(4).times(WAD))), b)
    .minus(b)
    .div(BigNumber(2))
    .integerValue(BigNumber.ROUND_FLOOR);
}
