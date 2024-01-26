import BigNumber from "bignumber.js";
import {
  AssetData,
  TYPE_NETWORK,
  WAD_EVM,
  WAD_SOLANA,
  WAD_STELLAR,
} from "./scripts";

import { sqrt, wdiv, wmul } from "./safe_math";

export function quoteSwap(
  network: TYPE_NETWORK,
  fromAsset: Omit<AssetData, "totalSupply">,
  toAsset: Omit<AssetData, "totalSupply">,
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

  const toCash = toAsset.cash;
  const toLiability = toAsset.liability;

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

export function quoteDepositLiquidity(
  network: TYPE_NETWORK,
  asset: AssetData,
  amount: BigNumber,
  ampFactor: BigNumber,
  _equilCovRatio: BigNumber
): [BigNumber, BigNumber] {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
        ? WAD_STELLAR
        : WAD_EVM;

  const liabilityToMint =
    _equilCovRatio == WAD
      ? exactDepositLiquidityInEquilImpl(
        network,
        amount,
        asset.cash,
        asset.liability,
        ampFactor
      )
      : exactDepositLiquidityImpl(
        network,
        amount,
        asset.cash,
        asset.liability,
        ampFactor,
        _equilCovRatio
      );

  const liability = asset.liability;
  const lpTokenToMint = liability.isEqualTo(BigNumber(0))
    ? liabilityToMint
    : liabilityToMint
      .times(asset.totalSupply)
      .div(liability)
      .integerValue(BigNumber.ROUND_FLOOR);

  return [lpTokenToMint, liabilityToMint];
}

export function quoteWithdrawAmount(
  network: TYPE_NETWORK,
  asset: AssetData,
  liquidity: BigNumber,
  ampFactor: BigNumber,
  _equilCovRatio: BigNumber,
  withdrawalHaircutRate: BigNumber
): [BigNumber, BigNumber, BigNumber] {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
        ? WAD_STELLAR
        : WAD_EVM;

  const liabilityToBurn = asset.liability
    .times(liquidity)
    .div(asset.totalSupply)
    .integerValue(BigNumber.ROUND_FLOOR);

  if (liabilityToBurn.isEqualTo(BigNumber(0))) {
    throw new Error("CORE_ZERO_LIQUIDITY()");
  }

  let amount = _equilCovRatio.isEqualTo(WAD)
    ? withdrawalAmountInEquilImpl(
      network,
      BigNumber(0).minus(liabilityToBurn),
      asset.cash,
      asset.liability,
      ampFactor
    )
    : withdrawalAmountImpl(
      network,
      BigNumber(0).minus(liabilityToBurn),
      asset.cash,
      asset.liability,
      ampFactor,
      _equilCovRatio
    );
  let withdrawalHaircut = BigNumber(0);

  // charge withdrawal haircut
  if (withdrawalHaircutRate.gt(0)) {
    withdrawalHaircut = wmul(network, amount, withdrawalHaircutRate);
    amount = amount.minus(withdrawalHaircut);
  }

  return [amount, liabilityToBurn, withdrawalHaircut];
}

/**
 * @dev Calculate the withdrawal amount for any r*
 */
function withdrawalAmountImpl(
  network: TYPE_NETWORK,
  delta_i: BigNumber,
  A_i: BigNumber,
  L_i: BigNumber,
  A: BigNumber,
  _equilCovRatio: BigNumber
): BigNumber {
  const L_i_ = L_i.plus(delta_i);
  const r_i = wdiv(network, A_i, L_i);
  const delta_D = wmul(network, delta_i, _equilCovRatio).minus(
    delta_i.times(A).div(_equilCovRatio).integerValue(BigNumber.ROUND_FLOOR)
  ); // The only line that is different
  const b = BigNumber(0).minus(
    wmul(network, L_i, r_i.minus(wdiv(network, A, r_i)).plus(delta_D))
  );
  const c = wmul(network, A, wmul(network, L_i_, L_i_));
  const A_i_ = _solveQuad(network, b, c);
  return A_i.minus(A_i_);
}

/**
 * @dev should be used only when r* = 1
 */
function withdrawalAmountInEquilImpl(
  network: TYPE_NETWORK,
  delta_i: BigNumber,
  A_i: BigNumber,
  L_i: BigNumber,
  A: BigNumber
): BigNumber {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
        ? WAD_STELLAR
        : WAD_EVM;
  const L_i_ = L_i.plus(delta_i);
  const r_i = wdiv(network, A_i, L_i);

  const rho = wmul(network, L_i, r_i.minus(wdiv(network, A, r_i)));
  const beta = rho
    .plus(wmul(network, delta_i, WAD.minus(A)))
    .div(BigNumber(2))
    .integerValue(BigNumber.ROUND_FLOOR);
  const A_i_ = beta.plus(
    sqrt(beta.times(beta).plus(wmul(network, A, L_i_.times(L_i_))), beta)
  );

  return A_i.minus(A_i_);
}

/**
 * @notice return the deposit reward in token amount when target liquidity (LP amount) is known
 */
function exactDepositLiquidityInEquilImpl(
  network: TYPE_NETWORK,
  D_i: BigNumber,
  A_i: BigNumber,
  L_i: BigNumber,
  A: BigNumber
): BigNumber {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
        ? WAD_STELLAR
        : WAD_EVM;
  // public pure returns (int256 liquidity)
  if (L_i.isEqualTo(BigNumber(0))) {
    // if this is a deposit, there is no reward/fee
    // if this is a withdrawal, it should have been reverted
    return D_i;
  }
  if (A_i.plus(D_i).lt(BigNumber(0))) {
    // impossible
    throw new Error("CORE_UNDERFLOW()");
  }

  const r_i = wdiv(network, A_i, L_i);
  const k = D_i.plus(A_i);
  const b = wmul(network, k, WAD.minus(A)).plus(
    BigNumber(2).times(wmul(network, A, L_i))
  );
  const c = wmul(
    network,
    k,
    A_i.minus(A.times(L_i).div(r_i).integerValue(BigNumber.ROUND_FLOOR))
  )
    .minus(wmul(network, k, k))
    .plus(wmul(network, wmul(network, A, L_i), L_i));
  const l = b.times(b).minus(BigNumber(4).times(A).times(c));
  return wdiv(network, BigNumber(0).minus(b).plus(sqrt(l, b)), A)
    .div(BigNumber(2))
    .integerValue(BigNumber.ROUND_FLOOR);
}

function exactDepositLiquidityImpl(
  network: TYPE_NETWORK,
  D_i: BigNumber,
  A_i: BigNumber,
  L_i: BigNumber,
  A: BigNumber,
  _equilCovRatio: BigNumber
) {
  // public pure returns (int256 liquidity)
  if (L_i.isEqualTo(BigNumber(0))) {
    // if this is a deposit, there is no reward/fee
    // if this is a withdrawal, it should have been reverted
    return D_i;
  }

  if (A_i.plus(D_i).lt(BigNumber(0))) {
    // impossible
    throw new Error("CORE_UNDERFLOW()");
  }

  const r_i = wdiv(network, A_i, L_i);
  const k = D_i.plus(A_i);

  //k.wmul(_equilCovRatio) - (k * A) / _equilCovRatio + 2 * A.wmul(L_i); // The only line that is different
  const b = wmul(network, k, _equilCovRatio)
    .minus(k.times(A))
    .div(_equilCovRatio.plus(BigNumber(2).times(wmul(network, A, L_i))))
    .integerValue(BigNumber.ROUND_FLOOR);
  const c = wmul(
    network,
    k,
    A_i.minus(A.times(L_i).div(r_i).integerValue(BigNumber.ROUND_FLOOR))
  )
    .minus(wmul(network, k, k))
    .plus(wmul(network, wmul(network, A, L_i), L_i));
  const l = b.times(b).minus(BigNumber(4).times(A).times(c));
  return wdiv(network, BigNumber(0).minus(b).plus(sqrt(l, b)), A)
    .div(BigNumber(2))
    .integerValue(BigNumber.ROUND_FLOOR);
}

export function quoteWithdrawAmountFromOtherAsset(
  network: TYPE_NETWORK,
  fromAsset: AssetData,
  toAsset: Omit<AssetData, "totalSupply">,
  liquidity: BigNumber,
  ampFactor: BigNumber,
  scaleFactor: BigNumber,
  haircutRate: BigNumber,
  startCovRatio: BigNumber,
  endCovRatio: BigNumber,
  _equilCovRatio: BigNumber,
  withdrawalHaircutRate: BigNumber
): [BigNumber, BigNumber] {
  console.log('first----',  network,
  fromAsset,
  toAsset,
  liquidity,
  ampFactor,
  scaleFactor,
  haircutRate,
  startCovRatio,
  endCovRatio,
  _equilCovRatio,
  withdrawalHaircutRate)
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
        ? WAD_STELLAR
        : WAD_EVM;

  const [withdrewAmountTemp, liabilityToBurn, withdrawalHaircut] =
    quoteWithdrawAmount(
      network,
      fromAsset,
      liquidity,
      ampFactor,
      _equilCovRatio,
      withdrawalHaircutRate
    );

  // quote swap
  let fromCash = fromAsset.cash
    .minus(withdrewAmountTemp)
    .minus(withdrawalHaircut);
  let fromLiability = fromAsset.liability.minus(liabilityToBurn);

  let withdrewAmount = withdrewAmountTemp;
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
    withdrewAmount = withdrewAmountTemp
      .times(scaleFactor)
      .div(WAD)
      .integerValue(BigNumber.ROUND_FLOOR);
  }

  const idealToAmount = swapQuoteFunc(
    network,
    fromCash,
    toAsset.cash,
    fromLiability,
    toAsset.liability,
    withdrewAmount,
    ampFactor
  );

  // remove haircut
  let finalAmount = idealToAmount.minus(
    wmul(network, idealToAmount, haircutRate)
  );

  if (startCovRatio.gt(BigNumber(0)) || endCovRatio.gt(BigNumber(0))) {
    // charge high cov ratio fee
    const fee = highCovRatioFee(
      network,
      fromCash,
      fromLiability,
      withdrewAmount,
      finalAmount,
      startCovRatio,
      endCovRatio
    );

    // finalAmount = finalAmount.minus(fee);
    console.log('finalAmount--', finalAmount)
    console.log('withdrewAmount--', withdrewAmount)
  }
  return [finalAmount, withdrewAmount];
}

export function highCovRatioFee(
  network: TYPE_NETWORK,
  fromAssetCash: BigNumber,
  fromAssetLiability: BigNumber,
  fromAmount: BigNumber,
  quotedToAmount: BigNumber,
  startCovRatio: BigNumber,
  endCovRatio: BigNumber
): BigNumber {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
        ? WAD_STELLAR
        : WAD_EVM;
  const finalFromAssetCovRatio = wdiv(
    network,
    fromAssetCash.plus(fromAmount),
    fromAssetLiability
  );

  if (finalFromAssetCovRatio.gt(startCovRatio)) {
    // charge high cov ratio fee
    const feeRatio = _highCovRatioFee(
      network,
      wdiv(network, fromAssetCash, fromAssetLiability),
      finalFromAssetCovRatio,
      startCovRatio,
      endCovRatio
    );

    if (feeRatio.gt(WAD)) {
      throw new Error("CORE_INVALID_HIGH_COV_RATIO_FEE();");
    }
    return wmul(network, feeRatio, quotedToAmount);
  }
  return BigNumber(0);
}

/**
 * @notice Calculate the high cov ratio fee in the to-asset in a swap.
 * @dev When cov ratio is in the range [startCovRatio, endCovRatio], the marginal cov ratio is
 * (r - startCovRatio) / (endCovRatio - startCovRatio). Here we approximate the high cov ratio cut
 * by calculating the "average" fee.
 * Note: `finalCovRatio` should be greater than `initCovRatio`
 */
function _highCovRatioFee(
  network: TYPE_NETWORK,
  initCovRatio: BigNumber,
  finalCovRatio: BigNumber,
  startCovRatio: BigNumber,
  endCovRatio: BigNumber
): BigNumber {
  if (finalCovRatio.gt(endCovRatio)) {
    // invalid swap
    throw new Error("CORE_COV_RATIO_LIMIT_EXCEEDED()");
  } else if (
    finalCovRatio.lte(startCovRatio) ||
    finalCovRatio.lte(initCovRatio)
  ) {
    return BigNumber(0);
  }

  // 1. Calculate the area of fee(r) = (r - startCovRatio) / (endCovRatio - startCovRatio)
  // when r increase from initCovRatio to finalCovRatio
  // 2. Then multiply it by (endCovRatio - startCovRatio) / (finalCovRatio - initCovRatio)
  // to get the average fee over the range
  const a = initCovRatio.lte(startCovRatio)
    ? BigNumber("0")
    : initCovRatio
      .minus(startCovRatio)
      .times(initCovRatio.minus(startCovRatio));
  const b = finalCovRatio
    .minus(startCovRatio)
    .times(finalCovRatio.minus(startCovRatio));
  const fee = wdiv(
    network,
    b
      .minus(a)
      .div(finalCovRatio.minus(initCovRatio))
      .integerValue(BigNumber.ROUND_FLOOR)
      .div(BigNumber(2))
      .integerValue(BigNumber.ROUND_FLOOR),
    endCovRatio.minus(startCovRatio)
  );

  return fee;
}