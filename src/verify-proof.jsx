import { useState, useEffect } from "react";
import { Reclaim } from "@reclaimprotocol/js-sdk";
import * as StellarSDK from "@stellar/stellar-sdk";
import freighterApi from "@stellar/freighter-api";
import { keccak256 } from "@ethersproject/keccak256";
import { BASE_FEE, getServer } from "./utils/soroban";
import { TESTNET_DETAILS } from "./utils/network";
import { Buffer } from "buffer";
import {
  formatSignature,
  getRecId,
  getSerializedClaim,
  getHash,
} from "./utils/format";

export default function VerifyProof(props) {
  const [proof, setProof] = useState({});
  const [verified, setVerified] = useState(false);
  const [recId, setRecId] = useState(0);

  useEffect(() => {
    const newProof = Reclaim.transformForOnchain(props.proof);
    setProof(newProof);
  }, []);

  return (
    <div>
      <button
        className="button"
        onClick={async () => {
          let rec = getRecId(proof.signedClaim.signatures[0]);
          setRecId(rec);

          proof.signedClaim.signatures[0] = formatSignature(
            proof.signedClaim.signatures[0]
          );

          const serializedClaim = getSerializedClaim(proof);

          const bytes = getHash(serializedClaim);

          const sig_bytes = Buffer.from(proof.signedClaim.signatures[0], "hex");

          const contract = new StellarSDK.Contract(
            process.env.REACT_APP_CONTRACT_ADDRESS
          );

          const publicKey = await freighterApi.getPublicKey();

          const pass = TESTNET_DETAILS.networkPassphrase;
          const account = new StellarSDK.Account(publicKey, "0");

          const txBuilder = new StellarSDK.TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: pass,
          });

          const tx = txBuilder
            .addOperation(
              contract.call(
                "verify_proof",
                ...[
                  StellarSDK.nativeToScVal(bytes),
                  StellarSDK.nativeToScVal(sig_bytes),
                  StellarSDK.nativeToScVal(recId, { type: "u32" }),
                ]
              )
            )
            .setTimeout(StellarSDK.TimeoutInfinite)
            .build();

          const server = getServer();

          const preparedTransaction = await server.prepareTransaction(tx);
          const xdr = preparedTransaction.toXDR();

          await freighterApi.signTransaction(xdr, {
            network: TESTNET_DETAILS.network,
            networkPassphrase: TESTNET_DETAILS.networkPassphrase,
            accountToSign: publicKey,
          });
          setVerified(true)
        }}
      >
        Verify Proof
      </button>
      {verified && <p> Proof verified </p>}
      <style jsx="true">{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .button {
          border: solid 1px #ccc;
          margin: 0 0 20px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
