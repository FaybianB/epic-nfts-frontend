import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './styles/App.css';
import linkedinLogo from './assets/linkedin-logo.png';
import openseaLogo from './assets/opensea-logo.png';
import raribleLogo from './assets/rarible-logo.png';
import abi from "./utils/MyEpicNFT.json";

const App = () => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
    const [mintedTokenId, setMintedTokenId] = useState("");
    const [totalMinted, setTotalMinted] = useState(0);
    const linkedinLink = 'https://www.linkedin.com/in/faybianbyrd/';
    const openSeaCollectionLink = 'https://testnets.opensea.io/collection/epicnft-nuvddg26v4';
    const raribleCollectionLink = 'https://rinkeby.rarible.com/collection/0xB7eecfcA618c2CbB5Fd00Af6863Eb36bCb3f1026/items';
    const contractAddress = "0xB7eecfcA618c2CbB5Fd00Af6863Eb36bCb3f1026";
    const contractABI = abi.abi;
    const collectionSize = 100;

    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                console.log("Make sure you have metamask!");

                return;
            }

            console.log("We have the ethereum object", ethereum);
            
            // Check if we're authorized to access the user's wallet
            const accounts = await ethereum.request({ method: "eth_accounts" });
    
            if (accounts.length !== 0) {
                const account = accounts[0];
                
                console.log("Found an authorized account:", account);

                setCurrentAccount(account);
                
                verifyChain(ethereum);
            } else {
                console.log("No authorized account found")
            }
        } catch (error) {
          console.log(error);
        }
	};
	
    const connectWallet = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                alert("Get MetaMask!");

                return;
            }

            // Prompt the user to connect an ethereum account
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            
            console.log("Connected", accounts[0]);

            setCurrentAccount(accounts[0]);

            verifyChain();
        } catch (error) {
            console.log(error)
        }
    };

    const verifyChain = async () => {
        let chainId = await ethereum.request({ method: 'eth_chainId' });
        
        console.log("Connected to chain " + chainId);
        
        // String, hex code of the chainId of the Rinkebey test network
        const rinkebyChainId = "0x4"; 
        
        if (chainId !== rinkebyChainId) {
            const wrongChainError = "You are not connected to the Rinkeby Test Network!";
            
            alert(wrongChainError);

            throw wrongChainError;
        } else {
            getTotalNumberOfNftsMinted();
        }
    };
    
    const getContract = (ethereum) => {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        return new ethers.Contract(contractAddress, contractABI, signer);
    };
    
    const handleAccountChange = async () => {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        
        setMintedTokenId('');
        
        if (accounts.length === 0) {
            console.log('wallet disconnected');

            setCurrentAccount('');
        } else {
            const account = accounts[0];

            console.log("Found an authorized account:", account);

            setCurrentAccount(account);
        }
    };
    	
	const mintEpicNFT = async () => {
        setIsProcessingTransaction(true);
        
        setMintedTokenId('');

        try {
            const { ethereum } = window;

            if (ethereum) {
                await verifyChain(ethereum);
                
                const connectedContract = getContract(ethereum);
                
                console.log("Displaying wallet now to pay gas...")
                let nftTxn = await connectedContract.makeAnEpicNFT();
                
                console.log("Mining...please wait.")
                await nftTxn.wait();
                
                console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
                
                getTotalNumberOfNftsMinted();
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }

        setIsProcessingTransaction(false);
	};

    const getTotalNumberOfNftsMinted = async () => {
        try {
            const { ethereum } = window;
            
            if (ethereum) {
                const connectedContract = getContract(ethereum);
                const count = await connectedContract.getTotalNftsMintedSoFar();
                
                console.log("Retrieved total number of NFTs minted...", count.toNumber());
                
                setTotalMinted(count.toNumber());
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }
    };
    
    const attachWalletListeners = () => {
        const { ethereum } = window;
        const connectedContract = getContract(ethereum);

        ethereum.on('accountsChanged', handleAccountChange);
        ethereum.on('chainChanged', verifyChain);
        
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
	       setMintedTokenId(tokenId.toNumber());
        });
    };
    
    const renderNotConnectedButton = () => (
        <button
            className="cta-button connect-wallet-button"
            onClick={connectWallet}
        >
            Connect Wallet
        </button>
    );
    
    const renderMintButton = () => (
        <button
            className="cta-button mint-button"
            onClick={mintEpicNFT}
            disabled={isProcessingTransaction}
        >
            {isProcessingTransaction ? 'Minting...' : 'Mint'}
        </button>
    );
    
    const renderSoldOutButton = () => (
        <button
            className="cta-button sold-out-button"
            disabled
        >
            SOLD OUT
        </button>
    );

    const renderCollectionAccessButton = () => {
        return totalMinted === collectionSize ? renderSoldOutButton() : renderMintButton();
    };
    
    const renderSuccessContainer = () => {
        const openSeaLink = `https://testnets.opensea.io/assets/${contractAddress}/${mintedTokenId}`;
        const raribleLink = `https://rinkeby.rarible.com/token/${contractAddress}:${mintedTokenId}`;
        
        return mintedTokenId && (
            <div className="success-container">
                <span>
                    Success! We've minted your NFT.
                    View on <a href={openSeaLink} target="_blank">OpenSea</a > or <a href={raribleLink} target="_blank">Rarible</a>.
                </span>
            </div>    
        )
    };

    // Check for wallet connection and attach listeners on page load
    useEffect(async () => {
        checkIfWalletIsConnected();
        
        attachWalletListeners();
    }, []);
    
    return (
        <div className="App">
            <div className="container">
                <div className="collection-link-container">
                    <a href={openSeaCollectionLink} target="_blank">
                        <img alt="OpenSea" className="logo" src={openseaLogo} />
                    </a>
                    <a href={raribleCollectionLink} target="_blank">
                        <img alt="Rarible" className="logo" src={raribleLogo} />
                    </a>
                </div>
                <div className="header-container">
                    <p className="header gradient-text">The Epic NFT Collection</p>
                    <p className="sub-text">
                        3 Words... 1 Funny NFT... Mint yours today.
                    </p>
                    {
                        currentAccount ?
                            <>
                                {renderCollectionAccessButton()}
                                
                                <p className="mint-count">
                                    {totalMinted} / {collectionSize} Minted
                                </p>
                            </>
                        : renderNotConnectedButton()
                    }
                </div>
                {renderSuccessContainer()}
                <div className="footer-container">
                    <img
                        alt="Linked Logo"
                        className="logo"
                        src={linkedinLogo}
                    />
                    <a
                        className="footer-text"
                        href={linkedinLink}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {`Built by Faybian`}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default App;