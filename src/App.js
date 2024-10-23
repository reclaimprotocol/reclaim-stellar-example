import './App.css'
import { Reclaim } from '@reclaimprotocol/js-sdk'
import { useState } from 'react'
import QRCode from "react-qr-code";
import VerifyProof from './verify-proof';
import ConnectWallet from './wallet-button';

function App() {
  const [url, setUrl] = useState('')
  const [ready, setReady] = useState(false);
  const [proof, setProof] = useState({});

  const APP_ID = "0x408edDD2dF298C2F5df1E2eDE2eBF1278A96Ee45" //TODO: replace with your applicationId
  const reclaimClient = new Reclaim.ProofRequest(APP_ID)

  async function generateVerificationRequest() {
    const providerId = '1bba104c-f7e3-4b58-8b42-f8c0346cdeab' //TODO: replace with your provider ids you had selected while creating the application

    reclaimClient.addContext(
      (`user's address`),
      ('for acmecorp.com on 1st january')
    )

    await reclaimClient.buildProofRequest(providerId, true, "V2Linking");

    reclaimClient.setSignature(
      await reclaimClient.generateSignature( // this is an MVP, you should not generate the signature on the frontend
        "0x5bdaf747ad9333898a0d9cb613f499d0b00164d7b8230628cf7ffa30fd323372" //TODO : replace with your APP_SECRET
      )
    )

    const { requestUrl, statusUrl } =
      await reclaimClient.createVerificationRequest()

    setUrl(requestUrl)

    await reclaimClient.startSession({
      onSuccessCallback: proofs => {
        console.log('Verification success', proofs)
        setReady(true);
        setProof(proofs[0]);
        // Your business logic here
      },
      onFailureCallback: error => {
        console.error('Verification failed', error)
        // Your business logic here to handle the error
      }
    })
  }

  return (
    <div className="App">
      <ConnectWallet/>
      {!url && (
        <button onClick={generateVerificationRequest}>
          Create Claim QrCode
        </button>
      )}
      {url && (
        <QRCode value={url} />
      )}
      {ready && <VerifyProof proof={proof}></VerifyProof>}
    </div>
  )
}

export default App