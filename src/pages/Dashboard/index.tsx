import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button, Grid, Paper, TextField } from "@mui/material";
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

export const ampFactor_solana = BigNumber(12500);
export const haircutRate_solana = BigNumber(0);

export const ampFactor_stellar = BigNumber(12500);
export const haircutRate_stellar = BigNumber(1000);

export const ampFactor_evm = BigNumber(12500);
export const haircutRate_evm = BigNumber(1000);

export enum TYPE_NETWORK {
  SOLANA,
  STELLAR,
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
  const [resultSwap, setResultSwap] = React.useState<any>([]);
  console.log("resultSwap.toNumber()", new BigNumber(resultSwap[0]).toNumber());

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
  const onSubmit: SubmitHandler<any> = (data) => {
    const result = get_amount_in(
      TYPE_NETWORK.STELLAR,
      {
        cash: BigNumber(1000000),
        liability: BigNumber(1000000),
        underlyingDecimals: BigNumber(6),
      },
      {
        cash: BigNumber(12002000),
        liability: BigNumber(11999600),
        underlyingDecimals: BigNumber(6),
      },
      BigNumber(10000)
    );
    setResultSwap(new BigNumber(result[0]).toNumber());
    console.log("data", new BigNumber(result[0]).toNumber());
  };

  get_amount_out(
    TYPE_NETWORK.STELLAR,
    {
      cash: BigNumber(1000000),
      liability: BigNumber(1000000),
      underlyingDecimals: BigNumber(6),
    },
    {
      cash: BigNumber(12002000),
      liability: BigNumber(11999600),
      underlyingDecimals: BigNumber(6),
    },
    BigNumber(10000)
  );

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

  const handleSwapClick = () => {
    const result = get_amount_in(
      TYPE_NETWORK.STELLAR,
      {
        cash: BigNumber(1000000),
        liability: BigNumber(1000000),
        underlyingDecimals: BigNumber(6),
      },
      {
        cash: BigNumber(12002000),
        liability: BigNumber(11999600),
        underlyingDecimals: BigNumber(6),
      },
      BigNumber(10000)
    );
    console.log("result", result);
  };

  return (
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
        <Tab label="Item One" {...a11yProps(0)} />
        <Tab label="Item Two" {...a11yProps(1)} />
        <Tab label="Item Three" {...a11yProps(2)} />
        <Tab label="Item Four" {...a11yProps(3)} />
        <Tab label="Item Five" {...a11yProps(4)} />
        <Tab label="Item Six" {...a11yProps(5)} />
        <Tab label="Item Seven" {...a11yProps(6)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
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
          <Button
            variant="contained"
            sx={{ mt: 10 }}
            type="submit"
            // onClick={() =>
            //   get_amount_in(
            //     TYPE_NETWORK.STELLAR,
            //     {
            //       cash: BigNumber(1000000),
            //       liability: BigNumber(1000000),
            //       underlyingDecimals: BigNumber(6),
            //     },
            //     {
            //       cash: BigNumber(12002000),
            //       liability: BigNumber(11999600),
            //       underlyingDecimals: BigNumber(6),
            //     },
            //     BigNumber(10000)
            //   )
            // }
          >
            Contained
          </Button>
          <p>Result: {resultSwap}</p>
        </form>
      </TabPanel>
      <TabPanel value={value} index={1}>
        Item Two
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
  );
}
