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

export const ampFactor_stellar = BigNumber(12500);
export const haircutRate_stellar = BigNumber(1000);

export const ampFactor_evm = BigNumber(250000000000000);
export const haircutRate_evm = BigNumber(20000000000000);

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
        : TYPE_NETWORK.EVM,
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
        : TYPE_NETWORK.EVM,
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

  // get_amount_out(
  //   TYPE_NETWORK.STELLAR,
  //   {
  //     cash: BigNumber(1000000),
  //     liability: BigNumber(1000000),
  //     underlyingDecimals: BigNumber(6),
  //   },
  //   {
  //     cash: BigNumber(12002000),
  //     liability: BigNumber(11999600),
  //     underlyingDecimals: BigNumber(6),
  //   },
  //   BigNumber(10000)
  // );

  // get_amount_in(
  //   TYPE_NETWORK.STELLAR,
  //   {
  //     cash: BigNumber(1000000),
  //     liability: BigNumber(1000000),
  //     underlyingDecimals: BigNumber(6),
  //   },
  //   {
  //     cash: BigNumber(12002000),
  //     liability: BigNumber(11999600),
  //     underlyingDecimals: BigNumber(6),
  //   },
  //   BigNumber(10000)
  // );

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
          {/* <Tab label="Item Three" {...a11yProps(2)} />
          <Tab label="Item Four" {...a11yProps(3)} />
          <Tab label="Item Five" {...a11yProps(4)} />
          <Tab label="Item Six" {...a11yProps(5)} />
          <Tab label="Item Seven" {...a11yProps(6)} /> */}
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
          Item Three
        </TabPanel>
        <TabPanel value={value} index={3}>
          Item Four
        </TabPanel>
        <TabPanel value={value} index={4}>
          Item Five
        </TabPanel>
        <TabPanel value={value} index={5}>
          Item Six
        </TabPanel>
        <TabPanel value={value} index={6}>
          Item Seven
        </TabPanel>
      </Box>
    </>
  );
}
