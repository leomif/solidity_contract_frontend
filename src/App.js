import './App.css'

import React from 'react'
import { ethers } from 'ethers'



// Import App components
import { OnboardingButton } from './components/Onboarding'
import { UpdateForm } from './components/UpdateForm'

// Import contract address and artifact
import ContractArtifact from './contracts/leomif_first.json'
import contractAddress from './contracts/leomif_first-address.json'

class App extends React.Component {
  constructor () {
    super()

    this.state = {
      isConnected: false,
      contract: null,
      currentMessage: '',
      messageInterval: null,
	  updateTransactionHash: null,
      transactionError: null
    }

    this.onConnected = this.onConnected.bind(this)
    this.fetchMessage = this.fetchMessage.bind(this)
	this.updateMessage = this.updateMessage.bind(this)
  }

  componentWillUnmount () {
    if (this.state.messageInterval) {
      clearInterval(this.state.messageInterval)
    }
  }

  async onConnected () {
    // Use the MetaMask wallet as ethers provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    // Create a JavaScript object from the Contract ABI, to interact
    // with the leomif_first contract.
    const contract = new ethers.Contract(
      contractAddress.Contract,
      ContractArtifact.abi,
      provider.getSigner()
    )

    this.setState({
      isConnected: true,
      contract,
      // Start fetching the contract's message every 30 seconds
      messageInterval: setInterval(this.fetchMessage, 30000)
    })

    // Fetch the current message
    await this.fetchMessage()
  }

  async fetchMessage () {
    console.log('getting current contract message')
    this.setState({ currentMessage: await this.state.contract.message() })
  }
  
  async updateMessage (newMessage) {
    console.log('transfering new message...', newMessage)
    this.setState({ transactionError: null })

    try {
      // Call the update method of the contract
      const tx = await this.state.contract.update(newMessage)
      console.log('transaction is being created !! ', tx)
      // Store the transaction hash in the state
      this.setState({ updateTransactionHash: tx.hash })

      // Wait until the transaction is resolved (either mined
      // or returns with an error)
      const receipt = await tx.wait()
      console.log('Transaction ready ! -- ', receipt)
	   alert('Transaction successfull and can be viewed on :  https://testnet.snowtrace.io/tx/'+ this.state.updateTransactionHash);

      if (receipt.status === 0) {
        // An undefined error occurred
        throw new Error('Transaction failed')
      }

      // Fetch the current message with a delay of 1 second
      setTimeout(this.fetchMessage, 1000)
    } catch (error) {
      // An error occurred
      console.error(error)
      this.setState({ transactionError: error })
    } finally {
      this.setState({ updateTransactionHash: null })
    }
  }

  render () {
    const MessageComponent = <div>
      {this.state.currentMessage
        ? <p style={{fontWeight: "bold"}}>!! current message at leomif contract !! <br />&ldquo;{this.state.currentMessage}&rdquo;</p>
        : <p>waiting to get message...</p>
		
      }
    </div>

    return (
      <div className="App">
        <h1>leomif contract test..</h1>
        <h2>dApp structure on tesnet</h2>


        <OnboardingButton onConnected={this.onConnected} />

 {this.state.isConnected &&
          <div>
            {MessageComponent}
            <UpdateForm
              currentMessage={this.state.currentMessage}
              updateTransactionHash={this.state.updateTransactionHash}
              updateMessage={this.updateMessage}
			  
            />

          </div>
		  
		  
        }

        {this.state.transactionError &&
          <div>
            Transaction Error: {this.state.transactionError.code} {this.state.transactionError.message}
          </div>
        }
      </div>
    )
  }
}

export default App