import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useForm, SubmitHandler } from "react-hook-form";
import { fromWad, quoteSwap, toWad } from "help";
import BigNumber from "bignumber.js";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const WAD_SOLANA = BigNumber(100000000);
export const WAD_STELLAR = BigNumber(10000000);
export const WAD_EVM = BigNumber("1000000000000000000");

export const DECIMALS_SOLANA = BigNumber(8);
export const DECIMALS_STELLAR = BigNumber(7);
export const DECIMALS_EVM = BigNumber(18);

export const ampFactor_solana = BigNumber(25000);
export const haircutRate_solana = BigNumber(200000);
export const withdraw_haircutRate_solana = BigNumber(0);
export const startCovRatio_solana = BigNumber(0);
export const endCovRatio_solana = BigNumber(0);

export const ampFactor_stellar = BigNumber(12500);
export const haircutRate_stellar = BigNumber(1000);
export const withdraw_haircutRate_stellar = BigNumber(0);
export const startCovRatio_stellar = BigNumber("15000000");
export const endCovRatio_stellar = BigNumber("18000000");

export const ampFactor_evm = BigNumber(250000000000000);
export const haircutRate_evm = BigNumber(20000000000000);
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
  totalSupply?: BigNumber;
  underlyingDecimals: BigNumber;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
  };
}

export default function Dashboard() {
  const [value, setValue] = React.useState(0);
  const [resultSwapIn, setResultSwapIn] = React.useState<any>([]);
  const [resultSwapOut, setResultSwapOut] = React.useState<any>([]);
  const [covRatio, setCovRatio] = React.useState<any>(null);
  const [tvl, setTvl] = React.useState<any>(null);
  const [deposit, setDeposit] = React.useState<any>(null);
  const [withdrawl, setWithdrawl] = React.useState<any>(null);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    textAlign: "center",
    color: theme.palette.text.secondary,
  }));

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<any>();
  const onSubmitIn: SubmitHandler<any> = (data) => {
    const resultIn = get_amount_in(
      data.netWork == 0
        ? TYPE_NETWORK.SOLANA
        : data.netWork == 1
        ? TYPE_NETWORK.STELLAR
        : data.netWork == 2
        ? TYPE_NETWORK.EVM
        : TYPE_NETWORK.STELLAR,
      {
        cash: BigNumber(data.fromAssetCash),
        liability: BigNumber(data.fromAssetLiability),
        underlyingDecimals: BigNumber(data.fromAssetUnderlyingDecimals),
      },
      {
        cash: BigNumber(data.toAssetCash),
        liability: BigNumber(data.toAssetLiability),
        underlyingDecimals: BigNumber(data.toAssetUnderlyingDecimals),
      },
      data.toAmount && BigNumber(data.toAmount)
    );
    console.log("resultIn", resultIn);
    setResultSwapIn(new BigNumber(resultIn[0]).toNumber());
  };
  const onSubmitOut: SubmitHandler<any> = (data) => {
    const resultOut = get_amount_out(
      data.netWork == 0
        ? TYPE_NETWORK.SOLANA
        : data.netWork == 1
        ? TYPE_NETWORK.STELLAR
        : data.netWork == 2
        ? TYPE_NETWORK.EVM
        : TYPE_NETWORK.STELLAR,
      {
        cash: BigNumber(data.fromAssetCash),
        liability: BigNumber(data.fromAssetLiability),
        underlyingDecimals: BigNumber(data.fromAssetUnderlyingDecimals),
      },
      {
        cash: BigNumber(data.toAssetCash),
        liability: BigNumber(data.toAssetLiability),
        underlyingDecimals: BigNumber(data.toAssetUnderlyingDecimals),
      },
      data.fromAmount && BigNumber(data.fromAmount)
    );
    setResultSwapOut(new BigNumber(resultOut[0]).toNumber());
  };
  const onSubmitCovRatio: SubmitHandler<any> = (data) => {
    const resultOut = get_cov_ratio(
      BigNumber(data.cash),
      BigNumber(data.liability)
    );
    setCovRatio(new BigNumber(resultOut).toNumber());
  };
  const onSubmitTvl: SubmitHandler<any> = (data) => {
    const resultTvl = get_tvl(
      BigNumber(data.liability),
      BigNumber(data.lpTokenToTokenRatesBn),
      BigNumber(data.tokenPrices)
    );
    setTvl(new BigNumber(resultTvl).toNumber());
  };
  const onSubmitDeposit: SubmitHandler<any> = (data) => {
    const resultDeposit = quotePotentialDeposit(
      data.netWork == 0
        ? TYPE_NETWORK.SOLANA
        : data.netWork == 1
        ? TYPE_NETWORK.STELLAR
        : data.netWork == 2
        ? TYPE_NETWORK.EVM
        : TYPE_NETWORK.STELLAR,
      {
        cash: BigNumber(data.cash),
        liability: BigNumber(data.liability),
        totalSupply: BigNumber(data.totalSupply),
        underlyingDecimals: BigNumber(data.underlyingDecimals),
      },
      BigNumber(data.amount)
    );
    setDeposit(new BigNumber(resultDeposit).toNumber());

  };
  const onSubmitWithdrawl: SubmitHandler<any> = (data) => {
    const resultWithdrawl = quotePotentialDeposit(
      data.netWork == 0
        ? TYPE_NETWORK.SOLANA
        : data.netWork == 1
        ? TYPE_NETWORK.STELLAR
        : data.netWork == 2
        ? TYPE_NETWORK.EVM
        : TYPE_NETWORK.STELLAR,
      {
        cash: BigNumber(data.cash),
        liability: BigNumber(data.liability),
        totalSupply: BigNumber(data.totalSupply),
        underlyingDecimals: BigNumber(data.underlyingDecimals),
      },
      BigNumber(data.liquidity)
    );
    setWithdrawl(new BigNumber(resultWithdrawl).toNumber());
  };

  const get_amount_in = (
    network: TYPE_NETWORK,
    fromAsset: AssetData,
    toAsset: AssetData,
    toAmount: BigNumber
  ) => {
    return estimate_swap(
      network,
      fromAsset,
      toAsset,
      BigNumber(0).minus(toAmount)
    );
  };

  function get_amount_out(
    network: TYPE_NETWORK,
    fromAsset: AssetData,
    toAsset: AssetData,
    fromAmount: BigNumber
  ) {
    return estimate_swap(network, fromAsset, toAsset, fromAmount);
  }

  const get_cov_ratio = (cash: BigNumber, liability: BigNumber) => {
    const tvlValue =
      cash && liability && !liability.isZero() && !cash.isZero()
        ? cash.div(liability)
        : 0;
    return tvlValue;
  };

  const get_tvl = (
    liability: BigNumber,
    lpTokenToTokenRatesBn: BigNumber,
    tokenPrices: BigNumber
  ) => {
    console.log("lpTokenToTokenRatesBn", lpTokenToTokenRatesBn);
    const tvlInWei = calLPPrice(liability, lpTokenToTokenRatesBn, tokenPrices);
    console.log("tvlInWei", tvlInWei);
    return tvlInWei;
  };
  function calLPPrice(
    liability: BigNumber,
    lpTokenToTokenRatesBn: BigNumber,
    tokenPrice?: BigNumber
  ): BigNumber {
    // lp token amount to token amount
    // console.log('lpTokenToTokenRatesBn', lpTokenToTokenRatesBn)
    // if no token price, assume the token price is 1
    liability = liability.multipliedBy(lpTokenToTokenRatesBn);
    if (Boolean(tokenPrice?.toNumber())) {
      liability = liability.multipliedBy(tokenPrice as any);
    }

    return liability;
  }

  function estimate_swap(
    network: TYPE_NETWORK,
    fromAsset: AssetData,
    toAsset: AssetData,
    fromAmount: BigNumber
  ): [BigNumber, BigNumber] {
    let [actualToAmount, haircut] = _quoteFrom(
      network,
      fromAsset,
      toAsset,
      toWad(network, fromAmount, fromAsset.underlyingDecimals)
    );

    const toDecimal = toAsset.underlyingDecimals;

    if (fromAmount.gte(BigNumber(0))) {
      haircut = fromWad(network, haircut, toAsset.underlyingDecimals);
    } else {
      haircut = fromWad(network, haircut, fromAsset.underlyingDecimals);
    }
    return [fromWad(network, actualToAmount, toDecimal), haircut];
  }

  function _quoteFrom(
    network: TYPE_NETWORK,
    fromAsset: AssetData,
    toAsset: AssetData,
    fromAmount: BigNumber
  ): [BigNumber, BigNumber] {
    // internal view virtual returns(uint256 actualToAmount, uint256 toTokenFee)
    const scaleFactor = _quoteFactor(network);
    const ampFactor =
      network == TYPE_NETWORK.SOLANA ? ampFactor_solana : ampFactor_stellar;
    const haircutRate =
      network == TYPE_NETWORK.SOLANA ? haircutRate_solana : haircutRate_stellar;

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

  function _quoteFactor(network: TYPE_NETWORK): BigNumber {
    const WAD = network == TYPE_NETWORK.SOLANA ? WAD_SOLANA : WAD_STELLAR;
    return WAD;
  }

  function quotePotentialDeposit(
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
  function quotePotentialWithdraw(
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

  function quoteWithdrawAmount(
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
      .div(asset.totalSupply as any);

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
      delta_i.times(A).div(_equilCovRatio)
    ); // The only line that is different
    const b = BigNumber(0).minus(
      wmul(network, L_i, r_i.minus(wdiv(network, A, r_i)).plus(delta_D))
    );
    const c = wmul(network, A, wmul(network, L_i_, L_i_));
    const A_i_ = _solveQuad(network, b, c);
    return A_i.minus(A_i_);
  }

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
      .div(BigNumber(2));
    const A_i_ = beta.plus(
      sqrt(beta.times(beta).plus(wmul(network, A, L_i_.times(L_i_))), beta)
    );

    return A_i.minus(A_i_);
  }

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

  function quoteDepositLiquidity(
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
      : liabilityToMint.times(asset.totalSupply as any).div(liability);

    return [lpTokenToMint, liabilityToMint];
  }

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
    return BigNumber(0)
      .minus(b)
      .plus(wdiv(network, sqrt(l, b), A))
      .div(BigNumber(2).integerValue(BigNumber.ROUND_FLOOR));
  }

  function exactDepositLiquidityImpl(
    network: TYPE_NETWORK,
    D_i: BigNumber,
    A_i: BigNumber,
    L_i: BigNumber,
    A: BigNumber,
    _equilCovRatio: BigNumber
  ) {
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

    //k.wmul(_equilCovRatio) - (k * A) / _equilCovRatio + 2 * A.wmul(L_i); // The only line that is different
    const b = wmul(network, k, _equilCovRatio)
      .minus(k.times(A))
      .div(_equilCovRatio.plus(BigNumber(2).times(wmul(network, A, L_i))));
    const c = wmul(
      network,
      k,
      A_i.minus(A.times(L_i).div(r_i).integerValue(BigNumber.ROUND_FLOOR))
    )
      .minus(wmul(network, k, k))
      .plus(wmul(network, wmul(network, A, L_i), L_i));
    const l = b.times(b).minus(BigNumber(4).times(A).times(c));
    return BigNumber(0)
      .minus(b)
      .plus(wdiv(network, sqrt(l, b), A))
      .div(BigNumber(2).integerValue(BigNumber.ROUND_FLOOR));
  }

  function wdiv(network: TYPE_NETWORK, x: BigNumber, y: BigNumber): BigNumber {
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

  function wmul(network: TYPE_NETWORK, x: BigNumber, y: BigNumber): BigNumber {
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

  function fromWad(
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

  function toWad(network: TYPE_NETWORK, x: BigNumber, d: BigNumber): BigNumber {
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

  function sqrt(y: BigNumber, guess: BigNumber): BigNumber {
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

  return (
    <>
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          display: "flex",
          height: 524,
        }}
      >
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ borderRight: 1, borderColor: "divider" }}
        >
          <Tab label="Get amount in" {...a11yProps(0)} />
          <Tab label="get amount out" {...a11yProps(1)} />
          <Tab label="cov ratio" {...a11yProps(3)} />
          <Tab label="tvl" {...a11yProps(2)} />
          <Tab label="Deposit" {...a11yProps(4)} />
          <Tab label="Withdrawl" {...a11yProps(5)} />
          {/* <Tab label="Item Seven" {...a11yProps(6)} /> */}
        </Tabs>
        <TabPanel value={value} index={0}>
          <form onSubmit={handleSubmit(onSubmitIn)}>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
              >
                <FormControlLabel
                  value={0}
                  control={<Radio {...register("netWork")} />}
                  label="SOLANA"
                />
                <FormControlLabel
                  value={1}
                  control={<Radio {...register("netWork")} />}
                  label="STELLAR"
                />
                <FormControlLabel
                  value={2}
                  control={<Radio {...register("netWork")} />}
                  label="EVM"
                />
              </RadioGroup>
            </FormControl>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("fromAssetCash")}
                    id="outlined-multiline-flexible"
                    label="fromAssetCash"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("fromAssetLiability")}
                    id="outlined-multiline-flexible"
                    label="fromAssetLiability"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("fromAssetUnderlyingDecimals")}
                    id="outlined-multiline-flexible"
                    label="fromAssetUnderlyingDecimals"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={5}>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("toAssetCash")}
                    id="outlined-multiline-flexible"
                    label="toAssetCash"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("toAssetLiability")}
                    id="outlined-multiline-flexible"
                    label="toAssetLiability"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("toAssetUnderlyingDecimals")}
                    id="outlined-multiline-flexible"
                    label="toAssetUnderlyingDecimals"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={5}>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("toAmount")}
                    id="outlined-multiline-flexible"
                    label="toAmount"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", maxHeight: 80 }}>
              <Button variant="contained" sx={{ mt: 5, mr: 5 }} type="submit">
                Caculate
              </Button>
              <p style={{ fontWeight: 700, fontSize: 30 }}>
                Result: {resultSwapIn}
              </p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <form onSubmit={handleSubmit(onSubmitOut)}>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
              >
                <FormControlLabel
                  value={0}
                  control={<Radio {...register("netWork")} />}
                  label="SOLANA"
                />
                <FormControlLabel
                  value={1}
                  control={<Radio {...register("netWork")} />}
                  label="STELLAR"
                />
                <FormControlLabel
                  value={2}
                  control={<Radio {...register("netWork")} />}
                  label="EVM"
                />
              </RadioGroup>
            </FormControl>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("fromAssetCash")}
                    id="outlined-multiline-flexible"
                    label="fromAssetCash"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("fromAssetLiability")}
                    id="outlined-multiline-flexible"
                    label="fromAssetLiability"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("fromAssetUnderlyingDecimals")}
                    id="outlined-multiline-flexible"
                    label="fromAssetUnderlyingDecimals"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={5}>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("toAssetCash")}
                    id="outlined-multiline-flexible"
                    label="toAssetCash"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("toAssetLiability")}
                    id="outlined-multiline-flexible"
                    label="toAssetLiability"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("toAssetUnderlyingDecimals")}
                    id="outlined-multiline-flexible"
                    label="toAssetUnderlyingDecimals"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={5}>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("fromAmount")}
                    id="outlined-multiline-flexible"
                    label="fromAmount"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", maxHeight: 80 }}>
              <Button variant="contained" sx={{ mt: 5, mr: 5 }} type="submit">
                Caculate
              </Button>
              <p style={{ fontWeight: 700, fontSize: 30 }}>
                Result: {resultSwapOut}
              </p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <form onSubmit={handleSubmit(onSubmitCovRatio)}>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
              >
                <FormControlLabel
                  value={0}
                  control={<Radio {...register("netWork")} />}
                  label="SOLANA"
                />
                <FormControlLabel
                  value={1}
                  control={<Radio {...register("netWork")} />}
                  label="STELLAR"
                />
                <FormControlLabel
                  value={2}
                  control={<Radio {...register("netWork")} />}
                  label="EVM"
                />
              </RadioGroup>
            </FormControl>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("cash")}
                    id="outlined-multiline-flexible"
                    label="cash"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("liability")}
                    id="outlined-multiline-flexible"
                    label="liability"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", maxHeight: 80 }}>
              <Button variant="contained" sx={{ mt: 5, mr: 5 }} type="submit">
                Caculate
              </Button>
              <p style={{ fontWeight: 700, fontSize: 30 }}>
                Result: {covRatio}
              </p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={3}>
          <form onSubmit={handleSubmit(onSubmitTvl)}>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
              >
                <FormControlLabel
                  value={0}
                  control={<Radio {...register("netWork")} />}
                  label="SOLANA"
                />
                <FormControlLabel
                  value={1}
                  control={<Radio {...register("netWork")} />}
                  label="STELLAR"
                />
                <FormControlLabel
                  value={2}
                  control={<Radio {...register("netWork")} />}
                  label="EVM"
                />
              </RadioGroup>
            </FormControl>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("liability")}
                    id="outlined-multiline-flexible"
                    label="liability"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("lpTokenToTokenRatesBn")}
                    id="outlined-multiline-flexible"
                    label="lpTokenToTokenRates"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={4}>
                <Item>
                  {" "}
                  <TextField
                    {...register("tokenPrices")}
                    id="outlined-multiline-flexible"
                    label="tokenPrices"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", maxHeight: 80 }}>
              <Button variant="contained" sx={{ mt: 5, mr: 5 }} type="submit">
                Caculate
              </Button>
              <p style={{ fontWeight: 700, fontSize: 30 }}>Result: {tvl}</p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={4}>
          <form onSubmit={handleSubmit(onSubmitDeposit)}>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
              >
                <FormControlLabel
                  value={0}
                  control={<Radio {...register("netWork")} />}
                  label="SOLANA"
                />
                <FormControlLabel
                  value={1}
                  control={<Radio {...register("netWork")} />}
                  label="STELLAR"
                />
                <FormControlLabel
                  value={2}
                  control={<Radio {...register("netWork")} />}
                  label="EVM"
                />
              </RadioGroup>
            </FormControl>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("cash")}
                    id="outlined-multiline-flexible"
                    label="cash"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("liability")}
                    id="outlined-multiline-flexible"
                    label="liability"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("underlyingDecimals")}
                    id="outlined-multiline-flexible"
                    label="underlyingDecimals"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("totalSupply")}
                    id="outlined-multiline-flexible"
                    label="totalSupply"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("amount")}
                    id="outlined-multiline-flexible"
                    label="amount"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", maxHeight: 80 }}>
              <Button variant="contained" sx={{ mt: 5, mr: 5 }} type="submit">
                Caculate
              </Button>
              <p style={{ fontWeight: 700, fontSize: 30 }}>Result: {deposit}</p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={5}>
          <form onSubmit={handleSubmit(onSubmitWithdrawl)}>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
              >
                <FormControlLabel
                  value={0}
                  control={<Radio {...register("netWork")} />}
                  label="SOLANA"
                />
                <FormControlLabel
                  value={1}
                  control={<Radio {...register("netWork")} />}
                  label="STELLAR"
                />
                <FormControlLabel
                  value={2}
                  control={<Radio {...register("netWork")} />}
                  label="EVM"
                />
              </RadioGroup>
            </FormControl>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("cash")}
                    id="outlined-multiline-flexible"
                    label="cash"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("liability")}
                    id="outlined-multiline-flexible"
                    label="liability"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("underlyingDecimals")}
                    id="outlined-multiline-flexible"
                    label="underlyingDecimals"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("totalSupply")}
                    id="outlined-multiline-flexible"
                    label="totalSupply"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("liquidity")}
                    id="outlined-multiline-flexible"
                    label="liquidity"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", maxHeight: 80 }}>
              <Button variant="contained" sx={{ mt: 5, mr: 5 }} type="submit">
                Caculate
              </Button>
              <p style={{ fontWeight: 700, fontSize: 30 }}>Result: {withdrawl}</p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={6}>
          Item Seven
        </TabPanel>
      </Box>
    </>
  );
}
