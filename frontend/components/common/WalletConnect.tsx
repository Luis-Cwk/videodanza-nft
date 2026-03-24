'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export const WalletConnect = () => {
  return (
    <div style={{ display: 'inline-block' }}>
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          const ready = mounted

          if (!ready || !account) {
            return (
              <button
                onClick={openConnectModal}
                className="btn-fui"
                style={{ fontSize: '0.65rem', padding: '0.5rem 1rem' }}
              >
                CONNECT
              </button>
            )
          }

          if (chain?.unsupported) {
            return (
              <button
                onClick={openChainModal}
                className="btn-fui"
                style={{ borderColor: '#ff4444', color: '#ff4444', fontSize: '0.65rem', padding: '0.5rem 1rem' }}
              >
                WRONG CHAIN
              </button>
            )
          }

          return (
            <button
              onClick={openAccountModal}
              className="btn-fui"
              style={{ fontSize: '0.65rem', padding: '0.5rem 1rem' }}
            >
              {account.displayName}
              {account.displayBalance ? ` (${account.displayBalance})` : ''}
            </button>
          )
        }}
      </ConnectButton.Custom>
    </div>
  )
}
