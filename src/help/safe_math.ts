import { BigNumber } from "bignumber.js";

import {
  WAD_SOLANA,
  WAD_STELLAR,
  WAD_EVM,
  DECIMALS_SOLANA,
  DECIMALS_STELLAR,
  TYPE_NETWORK,
  DECIMALS_EVM,
} from "./scripts";

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