export const config = {
    modules: {
        aptos: {
            enabled: true,
            addresses: './user_data/addresses/aptos.txt',
            minBalanceHighlight: 1
        },
        base: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.05
        },
        clusters: {
            enabled: false,
            addresses: './user_data/addresses/clusters.txt'
        },
        debridge: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt'
        },
        evm: {
            enabled: false,
            addresses: './user_data/addresses/evm.txt'
        },
        hyperlane: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt'
        },
        layerzero: {
            enabled: false,
            addresses: './user_data/addresses/evm.txt'
        },
        linea: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.05
        },
        scroll: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.05
        },
        wormhole: {
            enabled: false,
            addresses: './user_data/addresses/evm.txt'
        },
        zkbridge: {
            enabled: false,
            addresses: './user_data/addresses/evm.txt'
        },
        zksync: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.05
        },
        zora: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.05
        },
        balance: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.004,
            networks: {
                'ETH': {
                    enabled: true
                },
                'Arbitrum': {
                    enabled: true
                },
                'Optimism': {
                    enabled: true
                },
                'Polygon': {
                    enabled: true
                },
                'BSC': {
                    enabled: true
                },
                'opBNB': {
                    enabled: true
                },
                'Avalanche': {
                    enabled: true
                },
                'Base': {
                    enabled: true
                },
                'Core': {
                    enabled: true
                },
                'Celo': {
                    enabled: true
                },
                'Klaytn': {
                    enabled: true
                },
                'Fantom': {
                    enabled: true
                },
                'Moonbeam': {
                    enabled: false
                },
                'Moonriver': {
                    enabled: false
                },
                'Redstone': {
                    enabled: false
                },
                'Blast': {
                    enabled: false,
                },
                'Taiko': {
                    enabled: true
                },
                'Manta': {
                    enabled: true
                },
            }
        },
        rabby: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
        },        
        nft: {
            enabled: false,
            minCollectionPriceUSD: 10,
            addresses: './user_data/addresses/nft.txt',
        },     
        galxe: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            spaces: ['Caldera', 'Babylon', 'Berachain', 'BOB']
        }, 
        polygonzkevm: {
            enabled: false,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.005
        },
        jumper: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt'
        },
    },
    port: 80, // порт для запуска веб версии
    moralisApiKey: '',
    debug: false
}

export const rpcs = {
    'ETH': [
        'https://eth.llamarpc.com',
        'https://eth-mainnet.public.blastapi.io',
        'https://eth-pokt.nodies.app',
        'https://ethereum-rpc.publicnode.com',
        'https://ethereum.blockpi.network/v1/rpc/public',
        'https://rpc.ankr.com/eth',
        'https://eth.meowrpc.com',
    ],
    'Arbitrum': [
        'https://arbitrum.llamarpc.com',
        'https://1rpc.io/arb',
        'https://arbitrum-one.public.blastapi.io',
        'https://arb1.arbitrum.io/rpc',
        'https://rpc.ankr.com/arbitrum',
        'https://arbitrum.meowrpc.com',
        'https://api.zan.top/node/v1/arb/one/public',
        'https://arbitrum-one-rpc.publicnode.com',
        'https://arb-pokt.nodies.app',
        'https://arbitrum.drpc.org',
        'https://arbitrum.blockpi.network/v1/rpc/public'
    ],
    'Optimism': [
        'https://optimism.llamarpc.com',
        'https://optimism.drpc.org',
        'https://optimism-mainnet.public.blastapi.io',
        'https://optimism.meowrpc.com',
        'https://optimism.blockpi.network/v1/rpc/public',
        'https://optimism-rpc.publicnode.com',
        'https://mainnet.optimism.io',
        'https://rpc.ankr.com/optimism',
        'https://1rpc.io/op'
    ],
    'Polygon': [
        'https://polygon.llamarpc.com',
        'https://polygon-rpc.com',
        'https://rpc-mainnet.matic.network',
        'https://rpc-mainnet.matic.quiknode.pro',
        'https://matic-mainnet-full-rpc.bwarelabs.com',
        'https://polygon-pokt.nodies.app',
        'https://rpc.ankr.com/polygon',
        'https://polygon-mainnet.public.blastapi.io',
        'https://polygonapi.terminet.io/rpc',
        'https://1rpc.io/matic',
        'https://polygon-mainnet-public.unifra.io',
        'https://polygon.blockpi.network/v1/rpc/public',
        'https://polygon.drpc.org',
        'https://polygon.meowrpc.com',
    ],
    'BSC': [
        'https://binance.llamarpc.com',
        'https://endpoints.omniatech.io/v1/bsc/mainnet/public',
        'https://bsc-pokt.nodies.app',
        'https://rpc.ankr.com/bsc',
        'https://binance.nodereal.io',
        'https://1rpc.io/bnb',
        'https://bsc.blockpi.network/v1/rpc/public',
        'https://bsc-rpc.publicnode.com',
        'https://bsc-mainnet.public.blastapi.io',
        'https://bsc.meowrpc.com',
        'https://bsc.drpc.org',
    ],
    'Avalanche': [
        'https://avax.meowrpc.com',
        'https://avalanche.public-rpc.com',
        'https://rpc.ankr.com/avalanche',
        'https://blastapi.io/public-api/avalanche',
        'https://1rpc.io/avax/c',
        'https://avalanche.drpc.org',
    ],
    'Base': [
        'https://base.meowrpc.com',
        'https://base-mainnet.public.blastapi.io',
        'https://mainnet.base.org',
        'https://1rpc.io/base',
        'https://base.blockpi.network/v1/rpc/public'
    ],
    'Core': [
        'https://rpc.coredao.org',
        'https://core.public.infstones.com',
        'https://1rpc.io/core',
        'https://rpc.ankr.com/core',
        'https://core.drpc.org'
    ],
    'opBNB': [
        'https://opbnb-mainnet-rpc.bnbchain.org',
        'https://opbnb-rpc.publicnode.com',
        'https://1rpc.io/opbnb',
        'https://opbnb.drpc.org'
    ],
    'Celo': [
        'https://forno.celo.org',
        'https://rpc.ankr.com/celo',
        'https://1rpc.io/celo',
        'https://celo.api.onfinality.io/public'
    ],
    'Klaytn': [
        'https://1rpc.io/klay',
        'https://public-en-cypress.klaytn.net',
        'https://rpc.ankr.com/klaytn',
        'https://klaytn.blockpi.network/v1/rpc/public',
        'https://klaytn.api.onfinality.io/public',
        'https://1rpc.io/klay'
    ],
    'Fantom': [
        'https://rpcapi.fantom.network',
        'https://endpoints.omniatech.io/v1/fantom/mainnet/public',
        'https://fantom-pokt.nodies.app',
        'https://rpc.ftm.tools',
        'https://rpc.fantom.network',
        'https://rpc.ankr.com/fantom',
        'https://rpc2.fantom.network',
        'https://rpc3.fantom.network'
    ],
    'Moonbeam': [
        'https://rpc.api.moonbeam.network',
        'https://moonbeam.api.onfinality.io/public',
        'https://moonbeam.public.blastapi.io',
        'https://rpc.ankr.com/moonbeam',
        'https://1rpc.io/glmr',
        'https://moonbeam-rpc.dwellir.com'
    ],
    'Moonriver': [
        'https://rpc.api.moonriver.moonbeam.network',
        'https://moonriver.api.onfinality.io/public',
        'https://moonriver.public.blastapi.io',
        'https://moonriver-rpc.dwellir.com',
        'https://moonriver-rpc.publicnode.com'
    ],
    'Scroll': [
        'https://rpc.scroll.io'
    ],
    'Blast': [
        'https://rpc.envelop.is/blast',
        'https://blast.din.dev/rpc',
        'https://blastl2-mainnet.public.blastapi.io',
        'https://blast.blockpi.network/v1/rpc/public'
    ],
    'Polygonzkevm': [
        'https://zkevm-rpc.com',
        'https://polygon-zkevm.drpc.org',
        'https://1rpc.io/polygon/zkevm'
    ],
    'Taiko': [
        'https://rpc.taiko.xyz',
        'https://rpc.taiko.tools',
        'https://rpc.ankr.com/taiko'
    ],
    'Manta': [
        'https://pacific-rpc.manta.network/http',
        'https://1rpc.io/manta',
        'https://manta-pacific-gascap.calderachain.xyz/http'
    ],
}
