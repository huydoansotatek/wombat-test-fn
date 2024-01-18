import { BigNumber } from "bignumber.js";

import { fromWad, toWad, wdiv, wmul } from "./safe_math";

import {
  highCovRatioFee,
  quoteDepositLiquidity,
  quoteSwap,
  quoteWithdrawAmount,
} from "./core_v3";

export const WAD_SOLANA = BigNumber(100000000);
export const WAD_STELLAR = BigNumber(10000000);
export const WAD_EVM = BigNumber("1000000000000000000");

export const DECIMALS_SOLANA = BigNumber(8);
export const DECIMALS_STELLAR = BigNumber(7);
export const DECIMALS_EVM = BigNumber(18);

export const ampFactor_solana = BigNumber(100000000);
export const haircutRate_solana = BigNumber(200000);
export const withdraw_haircutRate_solana = BigNumber(0);
export const startCovRatio_solana = BigNumber(150000000);
export const endCovRatio_solana = BigNumber(180000000);

export const ampFactor_stellar = BigNumber(12500);
export const haircutRate_stellar = BigNumber(1000);
export const withdraw_haircutRate_stellar = BigNumber(0);
export const startCovRatio_stellar = BigNumber("15000000");
export const endCovRatio_stellar = BigNumber("18000000");

export const ampFactor_evm = BigNumber(12500);
export const haircutRate_evm = BigNumber(1000);
export const withdraw_haircutRate_evm = BigNumber(0);
export const startCovRatio_evm = BigNumber(0);
export const endCovRatio_evm = BigNumber(0);

export enum TYPE_NETWORK {
  SOLANA,
  STELLAR,
  EVM,
}

export type AssetData = {
  cash: BigNumber;
  liability: BigNumber;
  totalSupply: BigNumber;
  underlyingDecimals: BigNumber;
};

console.log("Swap amount out",
  get_amount_out(
    TYPE_NETWORK.STELLAR,
    {
      cash: BigNumber(201002000000),
      liability: BigNumber(200999999200),
      underlyingDecimals: BigNumber(6),
    },
    {
      cash: BigNumber(100498000050),
      liability: BigNumber(100500000000),
      underlyingDecimals: BigNumber(6),
    },
    BigNumber(100000)
  )[0].toString(), "\nHaircut", get_amount_out(
    TYPE_NETWORK.STELLAR,
    {
      cash: BigNumber(201002000000),
      liability: BigNumber(200999999200),
      underlyingDecimals: BigNumber(6),
    },
    {
      cash: BigNumber(100498000050),
      liability: BigNumber(100500000000),
      underlyingDecimals: BigNumber(6),
    },
    BigNumber(100000)
  )[1].toString())


console.log("Swap amount in",
  get_amount_in(
    TYPE_NETWORK.STELLAR,
    {
      cash: BigNumber(201002000000),
      liability: BigNumber(200999999200),
      underlyingDecimals: BigNumber(6),
    },
    {
      cash: BigNumber(100498000050),
      liability: BigNumber(100500000000),
      underlyingDecimals: BigNumber(6),
    },
    BigNumber(100000)
  )[0].toString(), "\nHaircut", get_amount_in(
    TYPE_NETWORK.STELLAR,
    {
      cash: BigNumber(201002000000),
      liability: BigNumber(200999999200),
      underlyingDecimals: BigNumber(6),
    },
    {
      cash: BigNumber(100498000050),
      liability: BigNumber(100500000000),
      underlyingDecimals: BigNumber(6),
    },
    BigNumber(100000)
  )[1].toString())

  console.log('test cidc')
console.log(
  "Deposit",
  quotePotentialDeposit(
    TYPE_NETWORK.SOLANA,
    {
      cash: BigNumber("4101702000000"),
      liability: BigNumber("4101702000000"),
      totalSupply: BigNumber("2300000000000"),
      underlyingDecimals: BigNumber(6),
    },
    BigNumber("1000000")
  ).toString()
);

console.log(
  "Withdraw",
  quotePotentialWithdraw(
    TYPE_NETWORK.SOLANA,
    {
      cash: BigNumber("4101702000000"),
      liability: BigNumber("4101702000000"),
      totalSupply: BigNumber("2300000000000"),
      underlyingDecimals: BigNumber(6),
    },
    BigNumber("1000000")
  ).toString()
);

export function get_amount_in(
  network: TYPE_NETWORK,
  fromAsset: Omit<AssetData, "totalSupply">,
  toAsset: Omit<AssetData, "totalSupply">,
  toAmount: BigNumber
): [BigNumber, BigNumber] {
  const [actualToAmount, haircut] = estimate_swap(
    network,
    fromAsset,
    toAsset,
    BigNumber(0).minus(toAmount)
  );
  return [actualToAmount, haircut];
}

export function get_amount_out(
  network: TYPE_NETWORK,
  fromAsset: Omit<AssetData, "totalSupply">,
  toAsset: Omit<AssetData, "totalSupply">,
  fromAmount: BigNumber
): [BigNumber, BigNumber] {
  const [actualToAmount, haircut] = estimate_swap(
    network,
    fromAsset,
    toAsset,
    fromAmount
  );
  return [actualToAmount, haircut];
}

export function estimate_swap(
  network: TYPE_NETWORK,
  fromAsset: Omit<AssetData, "totalSupply">,
  toAsset: Omit<AssetData, "totalSupply">,
  fromAmount: BigNumber
): [BigNumber, BigNumber] {
  const [actualToAmount, haircut] = _quoteFrom(
    network,
    fromAsset,
    toAsset,
    toWad(network, fromAmount, fromAsset.underlyingDecimals)
  );

  const toDecimal = toAsset.underlyingDecimals;

  let newHairCut;

  if (fromAmount.gte(BigNumber(0))) {
    newHairCut = fromWad(network, haircut, toAsset.underlyingDecimals);
  } else {
    newHairCut = fromWad(network, haircut, fromAsset.underlyingDecimals);
  }

  return [fromWad(network, actualToAmount, toDecimal), newHairCut];
}

export function quotePotentialDeposit(
  network: TYPE_NETWORK,
  asset: AssetData,
  amount: BigNumber
): BigNumber {
  const decimals = asset.underlyingDecimals;
  const ampFactor =
    network == TYPE_NETWORK.SOLANA
      ? ampFactor_solana
      : network == TYPE_NETWORK.STELLAR
        ? ampFactor_stellar
        : ampFactor_evm;

  const [liquidity] = quoteDepositLiquidity(
    network,
    asset,
    toWad(network, amount, decimals),
    ampFactor,
    _getGlobalEquilCovRatioForDepositWithdrawal(network)
  );

  return liquidity;
}

export function quotePotentialWithdraw(
  network: TYPE_NETWORK,
  asset: AssetData,
  liquidity: BigNumber
): BigNumber {
  const ampFactor =
    network == TYPE_NETWORK.SOLANA
      ? ampFactor_solana
      : network == TYPE_NETWORK.STELLAR
        ? ampFactor_stellar
        : ampFactor_evm;

  const withdraw_haircut_rate =
    network == TYPE_NETWORK.SOLANA
      ? withdraw_haircutRate_solana
      : network == TYPE_NETWORK.STELLAR
        ? withdraw_haircutRate_stellar
        : withdraw_haircutRate_evm;
  let [amount, ,] = quoteWithdrawAmount(
    network,
    asset,
    liquidity,
    ampFactor,
    _getGlobalEquilCovRatioForDepositWithdrawal(network),
    withdraw_haircut_rate
  );

  amount = fromWad(network, amount, asset.underlyingDecimals);

  return amount;
}
/**
 * For stable pools and rather-stable pools, r* is assumed to be 1 to simplify calculation
 */
function _getGlobalEquilCovRatioForDepositWithdrawal(
  network: TYPE_NETWORK
): BigNumber {
  const WAD =
    network == TYPE_NETWORK.SOLANA
      ? WAD_SOLANA
      : network == TYPE_NETWORK.STELLAR
        ? WAD_STELLAR
        : WAD_EVM;

  return WAD;
}

function _super_quoteFrom(
  network: TYPE_NETWORK,
  fromAsset: Omit<AssetData, "totalSupply">,
  toAsset: Omit<AssetData, "totalSupply">,
  fromAmount: BigNumber
): [BigNumber, BigNumber] {
  // internal view virtual returns(uint256 actualToAmount, uint256 toTokenFee)
  const scaleFactor = _quoteFactor(network);
  const ampFactor =
    network == TYPE_NETWORK.SOLANA
      ? ampFactor_solana
      : network == TYPE_NETWORK.STELLAR
        ? ampFactor_stellar
        : ampFactor_evm;
  const haircutRate =
    network == TYPE_NETWORK.SOLANA
      ? haircutRate_solana
      : network == TYPE_NETWORK.STELLAR
        ? haircutRate_stellar
        : haircutRate_evm;

  return quoteSwap(
    network,
    fromAsset,
    toAsset,
    fromAmount,
    ampFactor,
    scaleFactor,
    haircutRate
  );
}

function _quoteFrom(
  network: TYPE_NETWORK,
  fromAsset: Omit<AssetData, "totalSupply">,
  toAsset: Omit<AssetData, "totalSupply">,
  fromAmount: BigNumber
): [BigNumber, BigNumber] {
  let [actualToAmount, toTokenFee] = _super_quoteFrom(
    network,
    fromAsset,
    toAsset,
    fromAmount
  );

  const startCovRatio =
    network == TYPE_NETWORK.SOLANA
      ? startCovRatio_solana
      : network == TYPE_NETWORK.STELLAR
        ? startCovRatio_stellar
        : startCovRatio_evm;

  const endCovRatio =
    network == TYPE_NETWORK.SOLANA
      ? endCovRatio_solana
      : network == TYPE_NETWORK.STELLAR
        ? endCovRatio_stellar
        : endCovRatio_evm;

  if (fromAmount.gte(BigNumber("0"))) {
    const highCovRatioFeeValue = highCovRatioFee(
      network,
      fromAsset.cash,
      fromAsset.liability,
      fromAmount,
      actualToAmount,
      startCovRatio,
      endCovRatio
    );

    actualToAmount = actualToAmount.minus(highCovRatioFeeValue);
    toTokenFee = toTokenFee.plus(highCovRatioFeeValue);
  } else {
    // reverse quote
    const toAssetCash = toAsset.cash;
    const toAssetLiability = toAsset.liability;
    const finalToAssetCovRatio = wdiv(
      network,
      toAssetCash.plus(actualToAmount),
      toAssetLiability
    );
    if (finalToAssetCovRatio.lte(startCovRatio)) {
      // happy path: no high cov ratio fee is charged
      return [actualToAmount, toTokenFee];
    } else if (wdiv(network, toAssetCash, toAssetLiability).gte(endCovRatio)) {
      // the to-asset exceeds it's cov ratio limit, further swap to increase cov ratio is impossible
      throw new Error("WOMBAT_COV_RATIO_LIMIT_EXCEEDED();");
    }

    // reverse quote: cov ratio of the to-asset exceed endCovRatio. direct reverse quote is not supported
    // we binary search for a upper bound
    actualToAmount = _findUpperBound(
      network,
      toAsset,
      fromAsset,
      BigNumber(0).minus(fromAmount)
    );
    [, toTokenFee] = _quoteFrom(network, toAsset, fromAsset, actualToAmount);
  }
  return [actualToAmount, toTokenFee];
}

/**
 * @notice Binary search to find the upper bound of `fromAmount` required to swap `fromAsset` to `toAmount` of `toAsset`
 * @dev This function should only used as off-chain view function as it is a gas monster
 */
function _findUpperBound(
  network: TYPE_NETWORK,
  fromAsset: Omit<AssetData, "totalSupply">,
  toAsset: Omit<AssetData, "totalSupply">,
  toAmount: BigNumber
): BigNumber {
  const decimals = fromAsset.underlyingDecimals;
  const toWadFactor = toWad(network, BigNumber("1"), decimals);
  // the search value uses the same number of digits as the token
  const endCovRatio =
    network == TYPE_NETWORK.SOLANA
      ? endCovRatio_solana
      : network == TYPE_NETWORK.STELLAR
        ? endCovRatio_stellar
        : endCovRatio_evm;
  let high = fromWad(
    network,
    wmul(network, fromAsset.liability, endCovRatio).minus(fromAsset.cash),
    decimals
  );
  let low = BigNumber("1");

  // verify `high` is a valid upper bound

  let [quote] = _quoteFrom(
    network,
    fromAsset,
    toAsset,
    high.times(toWadFactor)
  );
  if (quote.lt(toAmount)) {
    throw new Error("WOMBAT_COV_RATIO_LIMIT_EXCEEDED();");
  }

  // Note: we might limit the maximum number of rounds if the request is always rejected by the RPC server
  while (low < high) {
    const mid = low
      .plus(high)
      .div(BigNumber("2"))
      .integerValue(BigNumber.ROUND_FLOOR);
    [quote] = _quoteFrom(network, fromAsset, toAsset, mid.times(toWadFactor));
    if (quote >= toAmount) {
      high = mid;
    } else {
      low = mid.plus(BigNumber(1));
    }
  }
  return high.times(toWadFactor);
}

function _quoteFactor(network: TYPE_NETWORK): BigNumber {
  const WAD = network == TYPE_NETWORK.SOLANA ? WAD_SOLANA : WAD_STELLAR;
  return WAD;
}