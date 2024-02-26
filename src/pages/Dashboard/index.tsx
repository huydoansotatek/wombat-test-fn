import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useForm, SubmitHandler } from "react-hook-form";
import BigNumber from "bignumber.js";
import {
  _getGlobalEquilCovRatioForDepositWithdrawal,
  estimate_swap,
  quotePotentialDeposit,
  quotePotentialWithdraw,
  quotePotentialWithdrawFromOtherAsset,
} from "help/scripts";
import { BigNumber as BignumberEther, constants } from "ethers";
import { safeWdiv, strToWad } from "@hailstonelabs/big-number-utils";

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
  const [priceImpactWad, setPriceImpactWad] = React.useState<any>(null);
  const [finalAmount, setFinalAmount] = React.useState<any>(null);
  const [withdrewAmount, setWithdrewAmount] = React.useState<any>(null);
  const [baseApr, setBaseApr] = React.useState<any>(null);
  const [bootedApr, setBootedApr] = React.useState<any>(null);
  const [estimatedBoostedAPRForSol, setEstimatedBoostedAPRForSol] = React.useState<any>(null);

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
    const resultWithdrawl = quotePotentialWithdraw(
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

  const getPriceImpactWad = (
    targetfromTokenAmount: string,
    targetToTokenAmount: string,
    marketFromTokenAmount: string,
    marketToTokenAmount: string
  ): any => {
    try {
      // rate = toAmount/fromAmount
      const targetToTokenAmountWad = strToWad(targetToTokenAmount);
      const targetFromTokenAmountWad = strToWad(targetfromTokenAmount);
      const marketToTokenAmountWad = strToWad(marketToTokenAmount);
      const marketFromTokenAmountWad = strToWad(marketFromTokenAmount);
      if (
        targetFromTokenAmountWad.eq("0") ||
        marketFromTokenAmountWad.eq("0")
      ) {
        return constants.Zero;
      }
      const quotedRateWad = safeWdiv(
        targetToTokenAmountWad,
        targetFromTokenAmountWad
      );
      const marketRateWad = safeWdiv(
        marketToTokenAmountWad,
        marketFromTokenAmountWad
      );
      if (marketRateWad.isZero()) {
        return constants.Zero;
      }
      // price impact formula = (market rate - quoted rate) / market rate
      const priceImpactWad = safeWdiv(
        marketRateWad.sub(quotedRateWad),
        marketRateWad
      );
      if (priceImpactWad.isNegative()) {
        return constants.Zero;
      }
      return priceImpactWad;
    } catch {
      return constants.Zero;
    }
  };

  const onSubmitPriceImpact: SubmitHandler<any> = (data) => {
    const result = getPriceImpactWad(
      data?.targetfromTokenAmount,
      data?.targetToTokenAmount,
      data?.marketFromTokenAmount,
      data?.marketToTokenAmount
    );
    if (result) {
      setPriceImpactWad(result.toString());
    }
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
    const tvlInWei = calLPPrice(liability, lpTokenToTokenRatesBn, tokenPrices);
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

  const onSubmitWithdrawOtherAsset: SubmitHandler<any> = (data) => {
    const result = quotePotentialWithdrawFromOtherAsset(
      data.netWork == 0
        ? TYPE_NETWORK.SOLANA
        : data.netWork == 1
        ? TYPE_NETWORK.STELLAR
        : data.netWork == 2
        ? TYPE_NETWORK.EVM
        : TYPE_NETWORK.STELLAR,
      {
        cash: BigNumber(data.cashFromAsset),
        liability: BigNumber(data.liabilityFromAsset),
        totalSupply: BigNumber(data.totalSupplyFromAsset),
        underlyingDecimals: BigNumber(data.underlyingDecimalsFromAsset),
      },
      {
        cash: BigNumber(data.cashToAsset),
        liability: BigNumber(data.liabilityToAsset),
        underlyingDecimals: BigNumber(data.underlyingDecimalsToAsset),
      },
      BigNumber(data?.liquidity)
    );
    setFinalAmount(Number(result[0]));
    setWithdrewAmount(Number(result[1]));
  };
  const onSubmitBaseApr: SubmitHandler<any> = (data) => {
    const result = aprForSolana(
      BigNumber(data.rewardRateWad),
      BigNumber(data.boostedPartition),
      BigNumber(data.totalLpStakedBN)
    );
    setBaseApr(result.toString())
  };
  const onSubmitBootedApr: SubmitHandler<any> = (data) => {
    const result = aprForSolana(
      BigNumber(data.rewardRateWad),
      BigNumber(data.boostedPartition),
      BigNumber(data.sumOfFactors)
    );
    setBootedApr(result.toString())
  };
  const onSubmitEstimateBootApr: SubmitHandler<any> = (data) => {
    estimateBoostedAprSol(
      BigNumber(data.stakedLpAmount),
      BigNumber(data.veWomBalance),
      BigNumber(data.stakeAmount),
      BigNumber(data.lockAmount),
      BigNumber(data.rewardRateWadSol),
      BigNumber(data.boostedPartitionSol),
      BigNumber(data.sumOfFactorSol)
    )
  };

  const calculateAprForSolana = (
    multiplicationFactor: BigNumber,
    annualReward: BigNumber,
    rewardPrice: BigNumber,
    totalAmount: BigNumber,
    depositUnitPrice: BigNumber
  ) => {
    const annualRewardInUsdWad = annualReward.multipliedBy(rewardPrice)
    const totalStakedAmountInUsdWad = totalAmount.multipliedBy(depositUnitPrice)
  
    return totalAmount > BigNumber(0) && depositUnitPrice > BigNumber(0)
      ? (multiplicationFactor.multipliedBy(annualRewardInUsdWad)).div(totalStakedAmountInUsdWad)
      : BigNumber(0)
  }

  const aprForSolana = React.useCallback((rewardRateWad: BigNumber, boostedPartition: BigNumber, totalLpStakedBN: BigNumber) => {
    const lpUnitPrice = BigNumber(1)
    const womPriceWad = BigNumber(1)
    const annualWomRewardWad = rewardRateWad
      .multipliedBy(BigNumber(60 * 60 * 24 * 365))
      .multipliedBy(boostedPartition)
      .div(BigNumber(1000))
    const estimatedBoostedApr = !lpUnitPrice
      ? BigNumber(0)
      : calculateAprForSolana(
          BigNumber(1),
          annualWomRewardWad,
          womPriceWad,
          totalLpStakedBN,
          lpUnitPrice
        )
    return estimatedBoostedApr
  }, [])


  function sqrtSolana(x: BigNumber) {
    const ONE = BigNumber(1)
    const TWO = BigNumber(2)
  
    let z = x.plus(ONE).div(TWO)
    let y = x
    while (z.minus(y).isNegative()) {
      y = z
      z = x.div(z).plus(z).div(TWO)
    }
    return y
  }

 function getFactorForSolana(depositAmount: BigNumber, veWomAmount: BigNumber): BigNumber {
    return sqrtSolana(depositAmount.multipliedBy(veWomAmount))
  }

  const estimateBoostedAprSol = React.useCallback(
    (
      oldDepositAmount: BigNumber,
      oldVeWomAmount: BigNumber,
      newDepositAmount: BigNumber,
      newVeWomAmount: BigNumber,
      rewardRateWadSolana: BigNumber,
      boostedPartitionSolana: BigNumber,
      sumOfFactorSol: BigNumber
    ) => {
      console.log('////////////////')
      console.log('oldDepositAmount', oldDepositAmount.toString())
      console.log('oldVeWomAmount', oldVeWomAmount.toString())
      console.log('////////////////')
      const lpUnitPrice = BigNumber(1)
      const rewardRateWad = BigNumber(Number(Number(rewardRateWadSolana) !== 0 ? rewardRateWadSolana : 1))
      const boostedPartition = BigNumber(Number(boostedPartitionSolana))
      const womPriceWad = BigNumber(1)
      const sumOfFactors = BigNumber(Number(sumOfFactorSol))
      const newFactor = getFactorForSolana(newDepositAmount, newVeWomAmount)
      const oldFactor = getFactorForSolana(oldDepositAmount, oldVeWomAmount)
      const annualWomRewardWad = rewardRateWad
        .multipliedBy(BigNumber(60 * 60 * 24 * 365))
        .multipliedBy(boostedPartition)
        .div(BigNumber(1000))
      const estimatedBoostedApr = calculateAprForSolana(
        newFactor.div(newDepositAmount),
        annualWomRewardWad,
        womPriceWad,
        sumOfFactors.minus(oldFactor).plus(newFactor),
        lpUnitPrice
      )
      setEstimatedBoostedAPRForSol(Number(estimatedBoostedApr))
    },
    []
  )


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
          <Tab label="Price Impact" {...a11yProps(6)} />
          <Tab label="withdraw other asset" {...a11yProps(6)} />
          <Tab label="base Apr" {...a11yProps(6)} />
          <Tab label="booted Apr" {...a11yProps(6)} />
          <Tab label="estimated boot Apr" {...a11yProps(6)} />
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
                Result: <span style={{ color: "red" }}>{resultSwapIn}</span>
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
                Result: <span style={{ color: "red" }}>{resultSwapOut}</span>
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
                Result: <span style={{ color: "red" }}>{covRatio}</span>
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
              <p style={{ fontWeight: 700, fontSize: 30 }}>
                Result: <span style={{ color: "red" }}>{tvl}</span>
              </p>
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
              <p style={{ fontWeight: 700, fontSize: 30 }}>
                Result: <span style={{ color: "red" }}>{deposit}</span>
              </p>
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
              <p style={{ fontWeight: 700, fontSize: 30 }}>
                Result: <span style={{ color: "red" }}>{withdrawl}</span>
              </p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={6}>
          <form onSubmit={handleSubmit(onSubmitPriceImpact)}>
            
            <Grid container spacing={2} mt={2}>
              <Grid item xs={6}>
                <Item>
                  {" "}
                  <TextField
                    {...register("targetfromTokenAmount")}
                    id="outlined-multiline-flexible"
                    label="targetfromTokenAmount"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={6}>
                <Item>
                  {" "}
                  <TextField
                    {...register("targetToTokenAmount")}
                    id="outlined-multiline-flexible"
                    label="targetToTokenAmount"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={6}>
                <Item>
                  {" "}
                  <TextField
                    {...register("marketFromTokenAmount")}
                    id="outlined-multiline-flexible"
                    label="marketFromTokenAmount"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={6}>
                <Item>
                  {" "}
                  <TextField
                    {...register("marketToTokenAmount")}
                    id="outlined-multiline-flexible"
                    label="marketToTokenAmount"
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
                Result: <span style={{ color: "red" }}>{priceImpactWad}</span>
              </p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={7}>
          <form onSubmit={handleSubmit(onSubmitWithdrawOtherAsset)}>
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
                    {...register("cashFromAsset")}
                    id="outlined-multiline-flexible"
                    label="cashFromAsset"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("liabilityFromAsset")}
                    id="outlined-multiline-flexible"
                    label="liabilityFromAsset"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("underlyingDecimalsFromAsset")}
                    id="outlined-multiline-flexible"
                    label="underlyingDecimalsFromAsset"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("totalSupplyFromAsset")}
                    id="outlined-multiline-flexible"
                    label="totalSupplyFromAsset"
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
                    {...register("cashToAsset")}
                    id="outlined-multiline-flexible"
                    label="cashToAsset"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("liabilityToAsset")}
                    id="outlined-multiline-flexible"
                    label="liabilityToAsset"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("underlyingDecimalsToAsset")}
                    id="outlined-multiline-flexible"
                    label="underlyingDecimalsToAsset"
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
              <p style={{ fontWeight: 700, fontSize: 30 }}>
                <div style={{ display: "flex" }}>
                  <p style={{marginRight: '50px'}}> Result:</p>
                  <div style={{ display: "flex", marginRight: '200px', alignItems: 'center' }}>
                    <p>finalAmount:</p>{" "}
                    <span style={{ color: "red" }}> {finalAmount} </span>
                  </div>
                  <div style={{ display: "flex", alignItems: 'center'  }}>
                    <p>withdrewAmount:</p>
                    <span style={{ color: "red" }}> {withdrewAmount} </span>
                  </div>
                </div>
              </p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={8}>
          <form onSubmit={handleSubmit(onSubmitBaseApr)}>
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
                    {...register("rewardRateWad")}
                    id="outlined-multiline-flexible"
                    label="rewardRateWad"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("boostedPartition")}
                    id="outlined-multiline-flexible"
                    label="boostedPartition"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("totalLpStakedBN")}
                    id="outlined-multiline-flexible"
                    label="totalLpStakedBN"
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
                <div style={{ display: "flex" }}>
                  <p style={{marginRight: '50px'}}> Result:</p>
                  <div style={{ display: "flex", marginRight: '200px', alignItems: 'center' }}>
                    <p>baseApr:</p>{" "}
                    <span style={{ color: "red" }}> {baseApr} </span>
                  </div>
                </div>
              </p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={9}>
          <form onSubmit={handleSubmit(onSubmitBootedApr)}>
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
                    {...register("rewardRateWadSol")}
                    id="outlined-multiline-flexible"
                    label="rewardRateWad"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("boostedPartitionSol")}
                    id="outlined-multiline-flexible"
                    label="boostedPartition"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("sumOfFactors")}
                    id="outlined-multiline-flexible"
                    label="sumOfFactors"
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
                <div style={{ display: "flex" }}>
                  <p style={{marginRight: '50px'}}> Result:</p>
                  <div style={{ display: "flex", marginRight: '200px', alignItems: 'center' }}>
                    <p>bootedApr:</p>{" "}
                    <span style={{ color: "red" }}> {bootedApr} </span>
                  </div>
                </div>
              </p>
            </Box>
          </form>
        </TabPanel>
        <TabPanel value={value} index={10}>
          <form onSubmit={handleSubmit(onSubmitEstimateBootApr)}>
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
                    {...register("stakedLpAmount")}
                    id="outlined-multiline-flexible"
                    label="stakedLpAmount"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("veWomBalance")}
                    id="outlined-multiline-flexible"
                    label="veWomBalance"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("stakeAmount")}
                    id="outlined-multiline-flexible"
                    label="stakeAmount"
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
                    {...register("lockAmount")}
                    id="outlined-multiline-flexible"
                    label="lockAmount"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("rewardRateWad")}
                    id="outlined-multiline-flexible"
                    label="rewardRateWad"
                    multiline
                    maxRows={4}
                  />
                </Item>
              </Grid>
              <Grid item xs={3}>
                <Item>
                  {" "}
                  <TextField
                    {...register("boostedPartition")}
                    id="outlined-multiline-flexible"
                    label="boostedPartition"
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
                    {...register("sumOfFactorSol")}
                    id="outlined-multiline-flexible"
                    label="sumOfFactorSol"
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
                <div style={{ display: "flex" }}>
                  <p style={{marginRight: '50px'}}> Result:</p>
                  <div style={{ display: "flex", marginRight: '200px', alignItems: 'center' }}>
                    <p>estimateBootedApr:</p>{" "}
                    <span style={{ color: "red" }}> {estimatedBoostedAPRForSol} </span>
                  </div>
                </div>
              </p>
            </Box>
          </form>
        </TabPanel>
      </Box>
    </>
  );
}
