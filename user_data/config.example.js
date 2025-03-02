export const config = {
    auth: {
        enabled: false,
        login: 'test',
        password: 'test',
    },
    modules: {
        airdrop: {
            enabled: true
        },
        points: {
            enabled: true,
            projects: {
                'zerion': {
                    enabled: true,
                    addresses: './user_data/addresses/evm.txt',
                },
            }
        },
        polymarket: {
            enabled: true,
            addresses: './user_data/addresses/polymarket.txt',
        },
        monad: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.001
        },
        soneium: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.001
        },
        eclipse: {
            enabled: true,
            addresses: './user_data/addresses/eclipse.txt',
            minBalanceHighlight: 0.005
        },
        story: {
            enabled: true,
            addresses: './user_data/addresses/story.txt',
        },
        aptos: {
            enabled: true,
            addresses: './user_data/addresses/aptos.txt',
            minBalanceHighlight: 1
        },
        base: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.005
        },
        clusters: {
            enabled: false,
            addresses: './user_data/addresses/clusters.txt'
        },
        debridge: {
            enabled: false,
            addresses: './user_data/addresses/debridge.txt'
        },
        evm: {
            enabled: false,
            addresses: './user_data/addresses/evm.txt'
        },
        hyperlane: {
            enabled: true,
            addresses: './user_data/addresses/hyperlane.txt'
        },
        layerzero: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            fromDate: '2024-05-01'
        },
        linea: {
            enabled: true,
            addresses: './user_data/addresses/linea.txt',
            minBalanceHighlight: 0.01
        },
        scroll: {
            enabled: false,
            addresses: './user_data/addresses/scroll.txt',
            minBalanceHighlight: 0.01
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
            enabled: false,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.05
        },
        zora: {
            enabled: true,
            addresses: './user_data/addresses/zora.txt',
            minBalanceHighlight: 0.005
        },
        balance: {
            enabled: true,
            addresses: './user_data/addresses/evm.txt',
            minBalanceHighlight: 0.005,
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
                'Base': {
                    enabled: true,
                },
                'Linea': {
                    enabled: true
                },
                'Polygon': {
                    enabled: false
                },
                'BSC': {
                    enabled: false
                },
                'opBNB': {
                    enabled: false,
                },
                'Avalanche': {
                    enabled: false,
                },
                'Core': {
                    enabled: false,
                },
                'Celo': {
                    enabled: false,
                },
                'Klaytn': {
                    enabled: false,
                },
                'Fantom': {
                    enabled: false,
                },
                'Moonbeam': {
                    enabled: false,
                },
                'Moonriver': {
                    enabled: false,
                },
                'Redstone': {
                    enabled: false,
                },
                'Blast': {
                    enabled: false,
                },
                'Taiko': {
                    enabled: false,
                },
                'Manta': {
                    enabled: false,
                },
                'Zero': {
                    enabled: false,
                },
                'Ink': {
                    enabled: false,
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
            spaces: ['LagrangeLabs']
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
        morph: {
            enabled: true,
            addresses: './user_data/addresses/morph.txt',
            minBalanceHighlight: 0.005
        },
    },
    port: 80, // порт для запуска веб версии
    moralisApiKey: '',
    debug: true
}

export const rpcs = {
    'ETH': [
        'https://eth.llamarpc.com',
        'https://rpc.ankr.com/eth'
    ],
    'Arbitrum': [
        'https://arbitrum.llamarpc.com',
        'https://rpc.ankr.com/arbitrum'
    ],
    'Optimism': [
        'https://optimism.llamarpc.com',
        'https://rpc.ankr.com/optimism'
    ],
    'Linea': [
        'https://rpc.linea.build',
        'https://linea.drpc.org'
    ],
    'Polygon': [
        'https://polygon.llamarpc.com',
        'https://rpc.ankr.com/polygon'
    ],
    'BSC': [
        'https://rpc.ankr.com/bsc',
        'https://bsc-dataseed.bnbchain.org'
    ],
    'Avalanche': [
        'https://avalanche.drpc.org',
        'https://avalanche.drpc.org'
    ],
    'Base': [
        'https://base.llamarpc.com',
        'https://base-mainnet.public.blastapi.io'
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
        'https://taiko-rpc.publicnode.com',
        'https://rpc.taiko.xyz'
    ],
    'Manta': [
        'https://pacific-rpc.manta.network/http',
        'https://1rpc.io/manta',
        'https://manta-pacific-gascap.calderachain.xyz/http'
    ],
    'Redstone': [
        'https://rpc.redstonechain.com',
    ],
    'Zero': [
        'https://rpc.zerion.io/v1/zero'
    ],
    'Ink': [
        'https://rpc-qnd.inkonchain.com',
        'https://rpc-gel.inkonchain.com'
    ]
}
