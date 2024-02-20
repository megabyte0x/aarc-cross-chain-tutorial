import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { useSendTransaction, useAccount } from "wagmi";
const Home: NextPage = () => {
  const { data: hash, sendTransaction } = useSendTransaction();
  const { address, chainId } = useAccount();

  const [fromToken, setFromToken] = useState("");
  const [toChain, setToChain] = useState("");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState(""); // State to display the "To" amount

  const [routeData, setRoute] = useState<any>(null);
  const [routeTxData, setRouteTxData] = useState<any>(null);
  const [approvalData, setApprovalData] = useState<any>(null);
  const [approvalTxData, setApprovalTxData] = useState<any>(null);

  const chains = [
    { id: 1, name: "Ethereum Mainnet" },
    { id: 56, name: "Binance Smart Chain" },
    { id: 137, name: "Polygon" },
  ];

  // Example token list
  const tokens = [
    { symbol: "USDC", name: "USD Coin" },
    // Add more tokens as needed
  ];

  useEffect(() => {}, []);

  const handleSwap = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Placeholder for swap logic
    alert(`Swap ${fromAmount} ${fromToken} to ${toToken}`);
  };

  const fetchRoute = async () => {
    try {
      // const params = new URLSearchParams({
      //   fromChainId: chainId?.toString() || "",
      //   toChainId: toChain,
      //   fromTokenAddress: fromToken,
      //   toTokenAddress: toToken,
      //   fromAmount: fromAmount,
      //   userAddress: address?.toString() || "",
      //   recipient: address?.toString() || "",
      //   routeType: "Value",
      // });
      const params = new URLSearchParams({
        fromChainId: "137",
        toChainId: "56",
        fromTokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        toTokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        fromAmount: "100000000",
        userAddress: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
        recipient: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
        routeType: "Value",
      });

      const response = await fetch(`/api/quote?${params.toString()}`, {
        // Assuming your API route is '/api' based on the file name `pages/api/index.ts`
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Route data:", data.route);
      setRoute(data.route);
    } catch (error) {
      console.error("Failed to fetch the route:", error);
    }
  };

  const fetchApprovalData = async () => {
    let response;
    try {
      response = await fetch(`/api/approvalData`, {
        // Assuming your API route is '/api' based on the file name `pages/api/index.ts`
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ route: routeData }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      if (response != undefined) {
        const data = await response.json();
        const routeTxData = data.responseInJson.result;

        console.log("Route transaction data:", routeTxData);
        setRouteTxData(routeTxData);

        const approvalData = data.responseInJson.result.approvalData;

        console.log("Approval data:", approvalData);
        setApprovalData(approvalData);
      }
    } catch (error) {
      console.error("Failed to fetch the transaction data:", error);
    }
  };

  const fetchApprovalTxData = async () => {
    let response;
    try {
      const params = new URLSearchParams({
        chainId: "137",
        owner: approvalData.owner,
        allowanceTarget: approvalData.allowanceTarget,
        tokenAddress: approvalData.approvalTokenAddress,
        amount: approvalData.minimumApprovalAmount,
      });

      response = await fetch(
        `/api/generateApprovalTxData?${params.toString()}`,
        {
          // Assuming your API route is '/api' based on the file name `pages/api/index.ts`
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      if (response != undefined) {
        const data = await response.json();
        console.log("Approval transaction data:", data.approvalTxData);
        setApprovalTxData(data.approvalTxData);
      }
    } catch (error) {
      console.error("Failed to fetch the approval transaction data:", error);
    }
  };

  const swap = async () => {
    await fetchRoute().then(async () => {
      await fetchApprovalData().then(async () => {
        await fetchApprovalTxData();
      });
    });
  };

  const sendApprovalTx = () => {
    console.log("Approval transaction data:", approvalTxData);
    sendTransaction({
      to: approvalTxData.to,
      data: approvalTxData.data,
    });
  };

  const sendBridgeTx = () => {
    sendTransaction({
      to: routeTxData.txTarget,
      data: routeTxData.txData,
    });
  };

  // Placeholder for a function to calculate the "To" amount based on the "From" amount
  // In a real application, you would replace this with actual logic, possibly fetching rates from an API
  const calculateToAmount = (fromAmount: string) => {
    // Simple calculation, replace with real conversion rate
    const rate = 1; // Placeholder rate
    setToAmount((parseFloat(fromAmount) * rate).toString());
  };

  // Update this function to also calculate the "To" amount whenever the "From" amount changes
  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amountValue = e.target.value;
    setFromAmount(amountValue);
    calculateToAmount(amountValue);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <ConnectButton />
        <form onSubmit={handleSwap} className={styles.swapForm}>
          <div className={styles.swapRow}>
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              required
            >
              <option value="">Select From Token</option>
              {tokens.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.swapRow}>
            <input
              type="number"
              value={fromAmount}
              onChange={handleFromAmountChange}
              placeholder="From Amount"
              required
            />
          </div>
          <div className={styles.swapRow}>
            <select
              value={toChain}
              onChange={(e) => setToChain(e.target.value)}
              required
            >
              <option value="">Select Destination Chain</option>
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.swapRow}>
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              required
            >
              <option value="">Select To Token</option>
              {tokens.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.swapRow}>
            {/* Display the calculated "To" amount. This field is read-only. */}
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="To Amount (Estimated)"
            />
          </div>
          <button type="button" onClick={swap} className={styles.swapButton}>
            Fetch Route
          </button>
        </form>
        <button
          type="button"
          onClick={sendApprovalTx}
          className={styles.swapButton}
        >
          Send Approval Tx
        </button>
        <button
          type="button"
          onClick={sendBridgeTx}
          className={styles.swapButton}
        >
          Send Bridge Tx
        </button>
      </main>
    </div>
  );
};

export default Home;
